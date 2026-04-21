"""init core schema (T38.1 — absorbs T19 + T20).

Creates the Doc 25 §4 PostgreSQL schema + PostGIS 3.4 spatial indexes:
- entities (core all-object table with tsvector + GiST + GIN)
- stars (partitioned by Gaia G magnitude per Doc 25 §4.1)
- galaxies (HEALPix-indexed)
- solar_system_bodies (Keplerian elements + JSONB atmosphere)
- exoplanets (NASA Archive ingest target)
- binary_systems (WDS + SB orbit catalogue)
- variables (GCVS)
- nebulae (NGC/IC/Sharpless/Barnard/LBN/LDN/Strasbourg/Green SNR)
- clusters (Harris GC + Dias OC + Abell + Planck SZ)
- cosmic_web_nodes (IllustrisTNG mesh)
- catalog_registry (per-catalog VERSIONS.json mirror)
- cross_identifications (SIMBAD-resolved cross-catalog ID table)

Spec: Doc 25 §4.1 (schema), Doc 23 §6 (catalog sources), Doc 23 §6.2 (cross-ID hierarchy).

Revision ID: 0001_init_core_schema
Create Date: 2026-04-19
"""
from __future__ import annotations

from alembic import op

revision = "0001_init_core_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # --- Extensions ------------------------------------------------------
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis;")
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm;")  # trigram for fuzzy search
    op.execute("CREATE EXTENSION IF NOT EXISTS btree_gist;")  # compound GiST indexes

    # --- Core: entities --------------------------------------------------
    op.execute(
        """
        CREATE TABLE entities (
            id              BIGSERIAL PRIMARY KEY,
            -- ent_id is the Doc 17 *subtype* identifier (e.g. ENT-7011 for
            -- "globular cluster"). It is deliberately NOT UNIQUE — many
            -- physical objects share the same Doc 17 subtype (all 29 Messier
            -- globulars → ENT-7011). Uniqueness at the object level is
            -- enforced via the cross_identifications table. Doc 25 §4.1's
            -- original UNIQUE constraint was a documentation error that live
            -- ingest caught (Messier T38.2 smoke test).
            ent_id          VARCHAR(12) NOT NULL,
            entity_type     SMALLINT NOT NULL,
            category        SMALLINT NOT NULL,
            name            TEXT NOT NULL,
            aliases         TEXT[],
            catalog_ids     JSONB,

            ra              DOUBLE PRECISION NOT NULL,
            dec_coord       DOUBLE PRECISION NOT NULL,
            distance_pc     DOUBLE PRECISION,
            galactic_l      DOUBLE PRECISION,
            galactic_b      DOUBLE PRECISION,
            position_3d     geometry(PointZ, 4326),

            properties      JSONB NOT NULL DEFAULT '{}'::jsonb,

            data_source     VARCHAR(32),
            data_quality    REAL,
            last_updated    TIMESTAMPTZ DEFAULT NOW(),

            -- Full-text vector maintained by trigger below. Can't use
            -- GENERATED ALWAYS AS STORED because to_tsvector(regconfig, text)
            -- is STABLE (not IMMUTABLE) and Postgres rejects both stored
            -- generated columns AND expression indexes that call it directly.
            -- Trigger pattern is the canonical workaround — see
            -- https://www.postgresql.org/docs/16/textsearch-features.html#TEXTSEARCH-UPDATE-TRIGGERS
            search_vector   tsvector,

            CONSTRAINT ra_range CHECK (ra >= 0 AND ra < 360),
            CONSTRAINT dec_range CHECK (dec_coord >= -90 AND dec_coord <= 90)
        );
        """
    )
    op.execute("CREATE INDEX idx_entities_position ON entities USING GIST (position_3d);")
    # Trigger to keep search_vector in sync with name + aliases.
    op.execute(
        """
        CREATE FUNCTION entities_update_search_vector() RETURNS trigger
        LANGUAGE plpgsql AS $$
        BEGIN
            NEW.search_vector :=
                setweight(to_tsvector('simple', COALESCE(NEW.name, '')), 'A') ||
                setweight(to_tsvector('simple',
                    COALESCE(array_to_string(NEW.aliases, ' '), '')), 'B');
            RETURN NEW;
        END;
        $$;
        """
    )
    op.execute(
        """
        CREATE TRIGGER trg_entities_search_vector
            BEFORE INSERT OR UPDATE OF name, aliases ON entities
            FOR EACH ROW EXECUTE FUNCTION entities_update_search_vector();
        """
    )
    op.execute("CREATE INDEX idx_entities_search ON entities USING GIN (search_vector);")
    # Auto-populate position_3d from (ra, dec_coord, distance_pc). Distance
    # defaults to 0 (celestial sphere) when unknown so cone search still works.
    op.execute(
        """
        CREATE FUNCTION entities_update_position_3d() RETURNS trigger
        LANGUAGE plpgsql AS $$
        BEGIN
            NEW.position_3d := ST_SetSRID(
                ST_MakePoint(NEW.ra, NEW.dec_coord, COALESCE(NEW.distance_pc, 0)),
                4326
            );
            RETURN NEW;
        END;
        $$;
        """
    )
    op.execute(
        """
        CREATE TRIGGER trg_entities_position_3d
            BEFORE INSERT OR UPDATE OF ra, dec_coord, distance_pc ON entities
            FOR EACH ROW EXECUTE FUNCTION entities_update_position_3d();
        """
    )
    op.execute("CREATE INDEX idx_entities_ent_id ON entities (ent_id);")
    op.execute("CREATE INDEX idx_entities_category ON entities (category);")
    op.execute(
        "CREATE INDEX idx_entities_category_mag ON entities "
        "(category, ((properties->>'magnitude_apparent')::real));"
    )
    op.execute("CREATE INDEX idx_entities_constellation ON entities ((properties->>'constellation'));")
    op.execute("CREATE INDEX idx_entities_name_trgm ON entities USING GIN (name gin_trgm_ops);")

    # --- Stars (partitioned by magnitude) --------------------------------
    op.execute(
        """
        CREATE TABLE stars (
            id                  BIGSERIAL,
            entity_id           BIGINT REFERENCES entities(id) ON DELETE CASCADE,
            source_id_gaia      BIGINT,

            ra                  DOUBLE PRECISION NOT NULL,
            dec_coord           DOUBLE PRECISION NOT NULL,
            parallax            REAL,
            parallax_error      REAL,
            pm_ra               REAL,
            pm_dec              REAL,
            radial_velocity     REAL,

            mag_g               REAL NOT NULL,
            mag_bp              REAL,
            mag_rp              REAL,
            bp_rp               REAL,

            teff                REAL,
            luminosity          REAL,
            radius_solar        REAL,
            mass_solar          REAL,
            spectral_type       VARCHAR(16),

            color_rgb           INTEGER,
            render_size         REAL,
            lod_level           SMALLINT,

            position_3d         geometry(PointZ, 4326),
            octree_tile_id      INTEGER,

            PRIMARY KEY (id, mag_g)
        ) PARTITION BY RANGE (mag_g);
        """
    )
    # Partition boundaries per Doc 25 §4.1.
    op.execute(
        "CREATE TABLE stars_bright    PARTITION OF stars FOR VALUES FROM (MINVALUE) TO (6.0);"
    )
    op.execute(
        "CREATE TABLE stars_naked_eye PARTITION OF stars FOR VALUES FROM (6.0) TO (10.0);"
    )
    op.execute(
        "CREATE TABLE stars_binocular PARTITION OF stars FOR VALUES FROM (10.0) TO (14.0);"
    )
    op.execute(
        "CREATE TABLE stars_telescope PARTITION OF stars FOR VALUES FROM (14.0) TO (18.0);"
    )
    op.execute(
        "CREATE TABLE stars_faint     PARTITION OF stars FOR VALUES FROM (18.0) TO (MAXVALUE);"
    )
    for part in ("bright", "naked_eye", "binocular", "telescope", "faint"):
        op.execute(f"CREATE INDEX idx_stars_{part}_pos ON stars_{part} USING GIST (position_3d);")
        # BRIN on magnitude is cheap and appropriate for range scans — T38 preamble requirement.
        op.execute(f"CREATE INDEX idx_stars_{part}_mag_brin ON stars_{part} USING BRIN (mag_g);")
    op.execute("CREATE INDEX idx_stars_tile ON stars (octree_tile_id, lod_level);")
    op.execute("CREATE INDEX idx_stars_gaia ON stars (source_id_gaia);")

    # --- Galaxies --------------------------------------------------------
    op.execute(
        """
        CREATE TABLE galaxies (
            id              BIGSERIAL PRIMARY KEY,
            entity_id       BIGINT REFERENCES entities(id) ON DELETE CASCADE,
            objid_sdss      BIGINT,
            pgc_id          INTEGER,

            ra              DOUBLE PRECISION NOT NULL,
            dec_coord       DOUBLE PRECISION NOT NULL,
            redshift        REAL,
            distance_mpc    REAL,

            mag_u           REAL,
            mag_g           REAL,
            mag_r           REAL,
            mag_i           REAL,
            mag_z           REAL,

            morphology      VARCHAR(16),
            sersic_n        REAL,
            axis_ratio      REAL,
            position_angle  REAL,
            angular_size    REAL,

            mass_solar      DOUBLE PRECISION,
            sfr             REAL,
            has_agn         BOOLEAN DEFAULT FALSE,

            position_3d     geometry(PointZ, 4326),
            healpix_idx     INTEGER
        );
        """
    )
    op.execute("CREATE INDEX idx_galaxies_pos ON galaxies USING GIST (position_3d);")
    op.execute("CREATE INDEX idx_galaxies_redshift ON galaxies (redshift);")
    op.execute("CREATE INDEX idx_galaxies_healpix ON galaxies (healpix_idx);")
    op.execute("CREATE INDEX idx_galaxies_morphology ON galaxies (morphology);")

    # --- Solar system bodies --------------------------------------------
    op.execute(
        """
        CREATE TABLE solar_system_bodies (
            id              SERIAL PRIMARY KEY,
            entity_id       BIGINT REFERENCES entities(id) ON DELETE CASCADE,
            naif_id         INTEGER UNIQUE,
            mpc_number      INTEGER,
            body_type       VARCHAR(24),
            parent_naif_id  INTEGER,

            semi_major_au   DOUBLE PRECISION,
            eccentricity    DOUBLE PRECISION,
            inclination     DOUBLE PRECISION,
            lon_asc_node    DOUBLE PRECISION,
            arg_periapsis   DOUBLE PRECISION,
            mean_anomaly    DOUBLE PRECISION,
            epoch_jd        DOUBLE PRECISION,

            mass_kg         DOUBLE PRECISION,
            radius_km       DOUBLE PRECISION,
            density         REAL,
            albedo          REAL,
            rotation_period DOUBLE PRECISION,
            axial_tilt      REAL,

            atmosphere      JSONB,
            surface_comp    JSONB,

            ring_system     JSONB,
            moon_count      INTEGER DEFAULT 0
        );
        """
    )
    op.execute("CREATE INDEX idx_ssb_naif ON solar_system_bodies (naif_id);")
    op.execute("CREATE INDEX idx_ssb_parent ON solar_system_bodies (parent_naif_id);")
    op.execute("CREATE INDEX idx_ssb_type ON solar_system_bodies (body_type);")
    op.execute("CREATE INDEX idx_ssb_mpc ON solar_system_bodies (mpc_number);")

    # --- Exoplanets ------------------------------------------------------
    op.execute(
        """
        CREATE TABLE exoplanets (
            id                    SERIAL PRIMARY KEY,
            entity_id             BIGINT REFERENCES entities(id) ON DELETE CASCADE,
            planet_name           TEXT NOT NULL,
            host_star             TEXT NOT NULL,
            host_star_entity_id   BIGINT REFERENCES entities(id),

            orbital_period_days   DOUBLE PRECISION,
            semi_major_au         DOUBLE PRECISION,
            eccentricity          REAL,
            inclination           REAL,

            mass_jupiter          REAL,
            radius_jupiter        REAL,
            density               REAL,
            equilibrium_temp      REAL,

            detection_method      VARCHAR(32),
            discovery_year        INTEGER,
            discovery_facility    TEXT,

            in_habitable_zone     BOOLEAN,
            esi                   REAL
        );
        """
    )
    op.execute("CREATE INDEX idx_exo_host ON exoplanets (host_star);")
    op.execute("CREATE INDEX idx_exo_method ON exoplanets (detection_method);")
    op.execute(
        "CREATE INDEX idx_exo_hz ON exoplanets (in_habitable_zone) "
        "WHERE in_habitable_zone = TRUE;"
    )

    # --- Binary systems (WDS + SB9) -------------------------------------
    op.execute(
        """
        CREATE TABLE binary_systems (
            id                  SERIAL PRIMARY KEY,
            primary_entity_id   BIGINT REFERENCES entities(id) ON DELETE CASCADE,
            wds_id              VARCHAR(16),
            sb9_id              INTEGER,
            kind                VARCHAR(16) NOT NULL,       -- 'visual', 'spectroscopic', 'eclipsing'
            components          INTEGER NOT NULL DEFAULT 2,

            -- Visual / WDS orbit (if resolved)
            period_years        REAL,
            semi_major_arcsec   REAL,
            eccentricity        REAL,
            inclination_deg     REAL,
            lon_asc_node_deg    REAL,
            arg_periapsis_deg   REAL,
            epoch_periapsis_jd  DOUBLE PRECISION,

            -- Magnitudes & separation
            mag_primary         REAL,
            mag_secondary       REAL,
            separation_arcsec   REAL,
            position_angle_deg  REAL
        );
        """
    )
    op.execute("CREATE INDEX idx_binary_primary ON binary_systems (primary_entity_id);")
    op.execute("CREATE INDEX idx_binary_wds ON binary_systems (wds_id);")

    # --- Variable stars (GCVS) ------------------------------------------
    op.execute(
        """
        CREATE TABLE variable_stars (
            id              SERIAL PRIMARY KEY,
            entity_id       BIGINT REFERENCES entities(id) ON DELETE CASCADE,
            gcvs_name       VARCHAR(32) UNIQUE,
            variable_type   VARCHAR(16) NOT NULL,  -- DCEP, RR, M, EA, CV, SN, etc.

            period_days     DOUBLE PRECISION,
            amplitude_mag   REAL,
            epoch_jd        DOUBLE PRECISION,
            mag_max         REAL,
            mag_min         REAL
        );
        """
    )
    op.execute("CREATE INDEX idx_variable_entity ON variable_stars (entity_id);")
    op.execute("CREATE INDEX idx_variable_type ON variable_stars (variable_type);")

    # --- Nebulae --------------------------------------------------------
    op.execute(
        """
        CREATE TABLE nebulae (
            id              SERIAL PRIMARY KEY,
            entity_id       BIGINT REFERENCES entities(id) ON DELETE CASCADE,
            ngc_id          VARCHAR(16),
            ic_id           VARCHAR(16),
            sharpless_id    INTEGER,
            barnard_id      INTEGER,
            lbn_id          INTEGER,
            ldn_id          INTEGER,
            strasbourg_pn_id VARCHAR(24),
            green_snr_id    VARCHAR(24),

            nebula_kind     VARCHAR(24) NOT NULL,   -- emission, reflection, dark, planetary, snr, wr, proto, superbubble
            ra              DOUBLE PRECISION NOT NULL,
            dec_coord       DOUBLE PRECISION NOT NULL,

            angular_size_arcmin REAL,
            distance_pc     DOUBLE PRECISION,
            central_star_entity_id BIGINT REFERENCES entities(id),

            position_3d     geometry(PointZ, 4326)
        );
        """
    )
    op.execute("CREATE INDEX idx_nebulae_pos ON nebulae USING GIST (position_3d);")
    op.execute("CREATE INDEX idx_nebulae_kind ON nebulae (nebula_kind);")

    # --- Clusters (GC + OC + galaxy clusters) ---------------------------
    op.execute(
        """
        CREATE TABLE clusters (
            id              SERIAL PRIMARY KEY,
            entity_id       BIGINT REFERENCES entities(id) ON DELETE CASCADE,
            cluster_kind    VARCHAR(16) NOT NULL,  -- 'open', 'globular', 'ob', 'galaxy_group', 'galaxy_cluster', 'supercluster'
            harris_id       VARCHAR(16),
            dias_id         VARCHAR(16),
            abell_id        VARCHAR(16),
            planck_sz_id    VARCHAR(32),

            ra              DOUBLE PRECISION NOT NULL,
            dec_coord       DOUBLE PRECISION NOT NULL,
            distance_pc     DOUBLE PRECISION,
            distance_mpc    REAL,
            redshift        REAL,

            n_members       INTEGER,
            age_yr          DOUBLE PRECISION,
            metallicity_fe_h REAL,
            mass_solar      DOUBLE PRECISION,

            position_3d     geometry(PointZ, 4326)
        );
        """
    )
    op.execute("CREATE INDEX idx_clusters_pos ON clusters USING GIST (position_3d);")
    op.execute("CREATE INDEX idx_clusters_kind ON clusters (cluster_kind);")

    # --- Cosmic web nodes -----------------------------------------------
    op.execute(
        """
        CREATE TABLE cosmic_web_nodes (
            id              BIGSERIAL PRIMARY KEY,
            sector          INTEGER NOT NULL,
            node_kind       SMALLINT NOT NULL,  -- 0=filament, 1=void, 2=wall, 3=lyman_alpha
            position_3d     geometry(PointZ, 4326) NOT NULL,
            density         REAL,
            connectivity    INTEGER
        );
        """
    )
    op.execute("CREATE INDEX idx_cwn_pos ON cosmic_web_nodes USING GIST (position_3d);")
    op.execute("CREATE INDEX idx_cwn_sector ON cosmic_web_nodes (sector);")
    op.execute("CREATE INDEX idx_cwn_kind ON cosmic_web_nodes (node_kind);")

    # --- Catalog registry (mirrors data/catalogs/VERSIONS.json) ---------
    op.execute(
        """
        CREATE TABLE catalog_registry (
            id              SERIAL PRIMARY KEY,
            catalog_name    VARCHAR(64) NOT NULL UNIQUE,
            source_url      TEXT NOT NULL,
            version         VARCHAR(32) NOT NULL,
            record_count    BIGINT,
            sha256          VARCHAR(64),
            ingested_at     TIMESTAMPTZ DEFAULT NOW(),
            license         VARCHAR(128),
            notes           TEXT
        );
        """
    )

    # --- Cross identifications ------------------------------------------
    op.execute(
        """
        CREATE TABLE cross_identifications (
            entity_id       BIGINT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
            catalog         VARCHAR(32) NOT NULL,  -- 'hipparcos', 'gaia_dr3', 'hd', 'hr', 'messier', 'ngc', 'ic', 'bayer', 'flamsteed', 'simbad', 'wds', 'pgc', 'ugc'
            catalog_ref     TEXT NOT NULL,
            is_primary      BOOLEAN DEFAULT FALSE,
            PRIMARY KEY (entity_id, catalog, catalog_ref)
        );
        """
    )
    op.execute(
        "CREATE INDEX idx_xid_catalog ON cross_identifications (catalog, catalog_ref);"
    )


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS trg_entities_position_3d ON entities;")
    op.execute("DROP TRIGGER IF EXISTS trg_entities_search_vector ON entities;")
    op.execute("DROP FUNCTION IF EXISTS entities_update_position_3d();")
    op.execute("DROP FUNCTION IF EXISTS entities_update_search_vector();")
    for table in (
        "cross_identifications",
        "catalog_registry",
        "cosmic_web_nodes",
        "clusters",
        "nebulae",
        "variable_stars",
        "binary_systems",
        "exoplanets",
        "solar_system_bodies",
        "galaxies",
        "stars_faint",
        "stars_telescope",
        "stars_binocular",
        "stars_naked_eye",
        "stars_bright",
        "stars",
        "entities",
    ):
        op.execute(f"DROP TABLE IF EXISTS {table} CASCADE;")
