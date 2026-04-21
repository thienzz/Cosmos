# Cosmos Explorer: User Journeys

**Document Version:** 1.0  
**Last Updated:** 2026-04-16  
**Status:** Published  
**Product:** Cosmos Explorer (Interactive 3D Universe Visualization)

---

## Overview

This document maps six core user journeys through Cosmos Explorer, capturing the diverse ways audiences engage with interactive 3D universe visualization. Each journey traces emotional arcs, interaction patterns, pain points, and moments of delight—revealing how different user types achieve their goals (whether discovery, education, content creation, research, or casual exploration).

---

## Journey 1: First-Time Discovery

### Persona Reference
**Name:** Alex Chen  
**Role:** Space Enthusiast  
**Background:** 28-year-old software engineer who loves astronomy but lacks formal training. Discovered Cosmos Explorer through a Reddit thread in r/space.

### Scenario Context
Alex is scrolling Reddit at home on a Friday evening, sees a post about Cosmos Explorer with screenshots of a 3D universe. Intrigued by the visuals and positive comments ("this is mind-blowing"), clicks the link. Has no prior experience with the tool but high curiosity and patience for exploration.

### Step-by-Step Flow

1. **Clicks Reddit link → browser opens Cosmos Explorer landing page**
   - Sees homepage with hero image of star field and tagline
   - Loading bar appears at bottom right
   - Emotions: Anticipation, curiosity
   - Touchpoints: Link from Reddit; page loads in default browser tab
   - Pain Points: Landing page text may be too dense; loading time unclear
   - Opportunity: Clear loading state with estimated time (e.g., "Loading universe...")

2. **Reads headline and value prop ("Explore the cosmos in real-time, from Earth to the edge of space")**
   - Skims key features listed below headline
   - Notices animated preview carousel in background
   - Emotions: Excitement, wonder
   - Touchpoints: Hero section text; carousel auto-playing
   - Pain Points: If carousel is too fast, user may not absorb messages
   - Opportunity: Carousel should pause on hover; highlight "3D" and "interactive" more prominently

3. **Sees "Launch Explorer" button prominently displayed**
   - Hovers over button, sees it highlight
   - Notes no signup required (inline text: "Free, no account needed")
   - Emotions: Relief, eagerness
   - Touchpoints: CTA button; small reassurance text
   - Pain Points: User hasn't seen system requirements or browser compatibility notes yet
   - Opportunity: Show browser icon/device support inline near button

4. **Clicks "Launch Explorer" → 3D canvas loads**
   - Screen goes dark, loading spinner appears (small, centered)
   - Takes 2-3 seconds; WebGL context initializes
   - Sees "Loading: Initializing Three.js and star database..." message
   - Emotions: Impatience, anticipation
   - Touchpoints: Loading spinner; status text
   - Pain Points: No visual progress indication; feels long for a browser app
   - Opportunity: Show milestones (e.g., "Loading 100,000 stars... Loading sun... Rendering...")

5. **Initial universe appears on screen**
   - View defaults to Earth orbit with Sun in center
   - Stars visible in background as 3D points
   - UI chrome appears: sidebar with labels, info panels (collapsed), sound controls
   - Audio begins—subtle ambient soundscape fades in softly
   - Emotions: AWE, wonder, disorientation (expecting more visual spectacle)
   - Touchpoints: 3D canvas; sidebar; sound icon in corner
   - Pain Points: Initial view is underwhelming compared to landing page screenshots; user unsure how to interact
   - Opportunity: Default to a more visually striking scene (e.g., Saturn with rings); show subtle tooltip: "Click to interact, drag to rotate"

6. **Reads intro tooltip or onboarding overlay**
   - Tooltip appears: "Drag to rotate. Scroll to zoom. Click any object for details."
   - Small "Tour" button in top-right corner suggests guided walkthrough
   - Emotions: Clarity, slight overwhelm (multiple affordances)
   - Touchpoints: Tooltip overlay; Tour button; close (X) button
   - Pain Points: Tooltip blocks view; too much instruction at once
   - Opportunity: Stagger onboarding—show one interaction hint at a time; auto-dismiss after user performs action

7. **Dismisses tooltip and experiments with dragging**
   - Clicks and drags on canvas to rotate view
   - Realizes moving causes the Sun to stay in place while view rotates
   - Performs a full rotation, delighted to see Earth, Moon, stars
   - Emotions: Delight, playfulness, competence
   - Touchpoints: Canvas drag interaction; no visual feedback lag
   - Pain Points: Rotation speed unclear; hard to know optimal drag distance
   - Opportunity: Show subtle crosshair or rotation indicator during drag

8. **Zooms out to see Solar System scale**
   - Scrolls mouse wheel (or trackpad pinch) to zoom
   - Canvas smoothly zooms out; now sees Sun, planets in orbits, asteroid belt
   - Reads planet labels as they appear (Mercury, Venus, Earth, Mars, etc.)
   - Emotions: Awe at scale, excitement about detail
   - Touchpoints: Mouse wheel / trackpad gesture; zoom animation; dynamic labels
   - Pain Points: Zoom speed may feel too fast or slow; no depth cues initially
   - Opportunity: Show distance scale (e.g., "1 AU from Sun" appearing on hover)

9. **Clicks on Saturn to see info panel**
   - Info panel slides in from right side
   - Displays: Name, distance, diameter, orbital period, rotation, temperature, composition, interesting fact
   - Panel has close (X), pin to favorite, share buttons
   - Emotions: Discovery, intellectual satisfaction, wonder
   - Touchpoints: Planet mesh (clickable); info panel (read-only); favorite + share buttons
   - Pain Points: Panel may be too tall; text too small on mobile; scientific terms unclear without glossary
   - Opportunity: Add glossary links for terms like "orbital eccentricity"; show visual comparison (e.g., "Saturn is 9x Earth's diameter")

10. **Clicks share button (planet info panel)**
    - Share menu appears with icons: Copy link, Twitter, Facebook, Reddit, WhatsApp
    - Link includes view state (planet=Saturn, zoom=5x)
    - Emotions: Pride, social engagement
    - Touchpoints: Share button; share menu dropdown
    - Pain Points: User may not know if link will reproduce exact view; social media icons may not be familiar
    - Opportunity: Show preview of shared link (what friend will see); confirm view state will be preserved

11. **Zooms out further to see galaxy scale (Milky Way)**
    - Continues scrolling zoom (or double-tap + drag)
    - Solar System shrinks; spiral galaxy structure becomes visible
    - Sun becomes a pixel; Earth invisible
    - New UI elements appear: "You are here" marker; info about current scale
    - Emotions: Overwhelming awe, perspective shift, minor disorientation
    - Touchpoints: Zoom gesture; view reset button (appears); scale indicator
    - Pain Points: User may feel lost; unsure if they can navigate back; no breadcrumb trail
    - Opportunity: Show "Zoom path" (list of scales: Earth → Solar System → Milky Way); add undo/reset button with visual emphasis

12. **Reads Milky Way info panel (auto-opened)**
    - Facts about Milky Way: 200 billion stars, 100,000 light-years diameter, age, structure
    - Contains embedded astronomy education content
    - Emotions: Intellectual engagement, wonder, slight overwhelm from number scale
    - Touchpoints: Auto-displayed info panel; read-only content
    - Pain Points: Numbers are large and abstract; hard to conceptualize
    - Opportunity: Add visual scale comparisons (e.g., "If Milky Way were Earth-sized, Solar System would be a pinhead"); show video or animation

13. **Explores interactive features: adjusts time slider**
    - Notices "Time" control in sidebar (currently at "Now")
    - Drags slider forward; sees planets moving, Sun rotating, date in corner advancing
    - Goes back in time; planets move backward, date changes to past year
    - Emotions: Playfulness, amusement, "this is so cool"
    - Touchpoints: Time slider; date display; animated planet movement
    - Pain Points: Rate of time progression unclear; no pause button initially visible
    - Opportunity: Show time speed indicator (e.g., "1 day per second"); add preset buttons (1 hour, 1 day, 1 month, 1 year)

14. **Adjusts ambient sound using sound control**
    - Clicks sound icon in corner; volume slider appears
    - Adjusts volume to comfortable level
    - Hears soundscape change (procedurally varied based on cosmic region)
    - Emotions: Immersion, comfort, delight
    - Touchpoints: Sound icon; volume slider
    - Pain Points: Sound may be startling if volume was up from another tab; no mute-on-load option
    - Opportunity: Let sound fade in automatically; show different soundscapes for different cosmic scales

15. **Takes first screenshot or shares view**
    - Right-clicks canvas to save screenshot
    - Or clicks share button again; copies link to clipboard
    - Sends to friend via text/Discord
    - Emotions: Satisfaction, social sharing, pride in discovery
    - Touchpoints: Right-click context menu or share button
    - Pain Points: Screenshot includes UI chrome (may be undesirable); sharing link may include account info
    - Opportunity: Add "Screenshot" button that hides UI; test link sharing to ensure privacy

### Success Metrics
- User completes at least 5 of these 15 steps
- Time from landing page click to first 3D interaction: < 10 seconds
- User returns to tool within 7 days
- User shares or bookmarks the link
- Session duration: > 5 minutes on first visit

### Edge Cases / Failure Modes
- **WebGL not supported:** Show clear error message with fallback (2D mode or link to upgrade browser)
- **Slow internet:** Loading spinner may persist; user perceives hang → add timeout with "Retry" button
- **Mobile on cellular:** Large file downloads may fail → show data saver mode option
- **Sound not working:** Silent fallback to visual-only; no error; notify via subtle icon
- **Touch device (tablet/phone):** Pinch-to-zoom works; drag rotation works; but UI may be too cramped → see Journey 6

---

## Journey 2: Classroom Lesson

### Persona Reference
**Name:** Dr. Sarah Morrison  
**Role:** High School Physics Teacher  
**Background:** 42-year-old educator with 15 years of teaching; comfortable with tech but not a power user. Teaches AP Physics and Astronomy to advanced 11th-12th graders.

### Scenario Context
Sarah is preparing a lesson on planetary orbits and Kepler's laws. She wants to show students *why* planets move as they do, and needs a tool that brings the abstract into visual, interactive space. She finds Cosmos Explorer recommended in a teacher forum. One week before her lesson, she explores the tool to plan what she'll demonstrate.

### Step-by-Step Flow

1. **Discovers Cosmos Explorer via teacher forum recommendation**
   - Reads recommendation: "Free tool to visualize orbital mechanics in real-time—perfect for Kepler's laws"
   - Clicks link from forum post
   - Emotions: Cautious interest, hope that it will work in classroom
   - Touchpoints: Forum link; browser navigation
   - Pain Points: No information about classroom suitability (screen size, projector compatibility, student engagement level)
   - Opportunity: Add "For Educators" section to landing page with classroom use cases and lesson plans

2. **Tests tool in personal browser; opens landing page**
   - Reads about features; notes "time simulation" and "orbital mechanics accuracy"
   - No immediate sign of educational content or lesson guides
   - Emotions: Initial approval, but slight concern about lack of educational framing
   - Touchpoints: Homepage text; feature list
   - Pain Points: Marketing copy is for general audiences, not educators; no curriculum alignment labels
   - Opportunity: Show "Educator Resources" banner; link to lesson plan downloads or standards alignment (NGSS, AP standards)

3. **Launches the 3D explorer to see Solar System**
   - Views default Earth orbit scene with Sun and planets visible
   - Immediately notices time slider; considers how to use it in lesson
   - Emotions: Validation—this is exactly what she needs
   - Touchpoints: 3D canvas; time slider control
   - Pain Points: None identified yet
   - Opportunity: Highlight "Ideal for demonstrating Kepler's first law" in a sidebar tooltip

4. **Navigates to Mars and Jupiter to compare orbital speeds**
   - Clicks on Mars; reads orbital period (1.88 years)
   - Clicks on Jupiter; reads orbital period (11.9 years)
   - Realizes she can use this to ask students: "Why does Jupiter take longer?" and then demonstrate with time slider
   - Emotions: Pedagogical excitement, planning mode activated
   - Touchpoints: Planet info panels; orbital period data
   - Pain Points: No visual overlay comparing orbits side-by-side; no annotations feature to mark key concepts
   - Opportunity: Add "Compare" mode to view two planets' data simultaneously; allow drawing orbits with colors

5. **Tests time slider to show orbital mechanics**
   - Drags time slider forward at various speeds
   - Watches planets move; inner planets lap outer planets
   - Thinks aloud: "Perfect—students will see Kepler's third law in action"
   - Emotions: Confidence, excitement about lesson plan
   - Touchpoints: Time slider; animated planet positions
   - Pain Points: Rate of time passage not intuitive (how many years per second?); hard to set specific time steps
   - Opportunity: Show "1 year per second" indicator; add preset buttons (advance 1 month, 1 year, 10 years)

6. **Considers projection setup—tests fullscreen mode**
   - Presses F11 or looks for fullscreen button
   - Canvas expands to fill screen; UI minimizes
   - Thinks: "Good—students won't be distracted by browser chrome"
   - Emotions: Practical satisfaction, confidence
   - Touchpoints: Fullscreen button (or keyboard shortcut)
   - Pain Points: No fullscreen button visible; had to find it via browser menu
   - Opportunity: Add prominent fullscreen button to UI; confirm resolution is high enough for projection

7. **Plans demonstration sequence and takes notes**
   - Opens a text editor or lesson planning app in another window
   - Jots down: "1) Show Solar System, 2) Ask about orbital periods, 3) Use time slider to demonstrate, 4) Click planets for data"
   - Considers which planets to emphasize
   - Emotions: Productive, engaged lesson planning
   - Touchpoints: Cosmos Explorer in one window; note-taking app in another
   - Pain Points: No way to save a "lesson sequence" within the tool; no bookmarking or lesson plan template
   - Opportunity: Add "Lesson Plan" save feature; allow teacher to create guided sequences that students follow step-by-step

8. **Tests student interaction—clicks various planets to see info panel content**
   - Reads facts about each planet: size, composition, moons, surface features, potential for life
   - Assesses: "Age-appropriate? Will keep students engaged?"
   - Notices some info is too technical; other facts are engaging
   - Emotions: Evaluative, slightly concerned about information level
   - Touchpoints: Planet info panels; read-only fact text
   - Pain Points: No way to customize which facts appear; no difficulty level selector (basic vs. advanced)
   - Opportunity: Add "Student-Friendly" vs. "Advanced" toggle for info content; let teachers select what to display

9. **Plans question prompts and checks if tool supports them**
   - Thinks: "I'll ask students, 'Why does Venus move faster than Neptune?' Can I show them?"
   - Adjusts time slider to see relative speeds; yes, visual is clear
   - Notes: "Tool works great for inquiry-based learning"
   - Emotions: Pedagogical validation, confidence
   - Touchpoints: Time slider; planet positions
   - Pain Points: None; the tool naturally supports inquiry
   - Opportunity: Provide optional "Discussion Prompts" modal that teachers can show in class

10. **Checks for sound and distraction level**
    - Hears ambient soundscape; considers if it will distract or help
    - Realizes she can mute sound for classroom (still too playful for some teachers' preferences)
    - Thinks: "I'll turn off sound during lesson, maybe use it for engagement moment at end"
    - Emotions: Practical consideration, minor concern about student focus
    - Touchpoints: Sound control; mute button
    - Pain Points: No "classroom mode" that auto-mutes sound or hides certain interactive elements
    - Opportunity: Add "Classroom Mode" preset that disables auto-play of sound, hides social sharing prompts

11. **Tests data accuracy by checking a known planet fact**
    - Looks up Earth's orbital period in info panel (365.25 days = 1 year); matches reality
    - Checks Moon's orbital period; clicks Moon (if visible); satisfied with accuracy
    - Emotions: Trust in tool, confidence to use in lesson
    - Touchpoints: Info panel data; external reference (mental model)
    - Pain Points: No source citations visible; teacher has to trust the data
    - Opportunity: Add "Data Sources" button in info panels; link to NASA, JPL, or other authoritative sources

12. **Considers accessibility and projection logistics**
    - Thinks: "Will students in the back be able to read the text in info panels? Will my projector handle WebGL smoothly?"
    - Realizes she should test projection on actual classroom projector
    - Makes note: "Test on Thursday in the classroom before lesson on Friday"
    - Emotions: Practical planning, slight anxiety about technical setup
    - Touchpoints: UI text size assessment (mental); tool responsiveness
    - Pain Points: No way to preview text size on different screens; no projector compatibility checklist
    - Opportunity: Add text size/contrast adjustment; provide a "Classroom Projection Checklist"

13. **Downloads or bookmarks the tool URL for classroom use**
    - Bookmarks Cosmos Explorer in browser
    - Considers if she needs to download anything or if it's always available online
    - Confirms: "Good—no installation needed, just open in any browser"
    - Emotions: Practical satisfaction, relief
    - Touchpoints: Bookmark action; URL bar
    - Pain Points: No offline version; if internet is down on lesson day, tool won't work
    - Opportunity: Provide offline version or downloadable cache for educators

14. **Writes lesson plan outline incorporating the tool**
    - Integrates Cosmos Explorer into her existing lesson on Kepler's Laws
    - Lesson sequence: 5-min intro → 10-min demo with tool → 15-min guided discovery (students ask questions, teacher uses tool to show) → 10-min individual exploration
    - Writes discussion questions: "Which planet travels fastest in its orbit? Why?"
    - Emotions: Fulfillment, readiness, confidence
    - Touchpoints: External lesson planning document
    - Pain Points: No standard lesson plan template for Cosmos Explorer; teacher creates own
    - Opportunity: Provide downloadable lesson plan templates (aligned with Kepler's Laws, planetary motion, etc.)

15. **Sets up day-of logistics: tests on projector, prepares backup**
    - Day of lesson, arrives early to test Cosmos Explorer on projector
    - Opens tool, confirms it displays clearly, time slider works, fullscreen is responsive
    - Confirms internet connection is stable (tool is cloud-based)
    - Prepares backup: screenshots of key views, PDF of facts, if tool fails
    - Emotions: Calm readiness, confidence
    - Touchpoints: Projector, browser, internet connection
    - Pain Points: None; preparation was successful
    - Opportunity: Provide "Classroom Check List" printable that guides setup testing

### Success Metrics
- Teacher successfully uses tool in lesson without technical issues
- Students demonstrate understanding of Kepler's Laws (assessed via quiz or activity post-lesson)
- Teacher uses tool in at least 2 subsequent lessons in the semester
- Teacher recommends tool to colleagues (word-of-mouth adoption)
- Lesson engagement score (teacher self-assessment): 4+/5

### Edge Cases / Failure Modes
- **Internet outage during lesson:** Tool is cloud-based and won't load → Backup: provide offline screenshots or download celestial database beforehand
- **Projector incompatibility:** Some older projectors don't support WebGL → Fallback: provide 2D or pre-recorded video mode
- **Student asks about object not in Solar System:** e.g., "Can we see Andromeda?" Tool may not include distant galaxies in default view → Extend tool to include nearby galaxies or acknowledge limitation
- **Classroom is too bright:** Sun representation may be hard to see on projector → Add "High Contrast Mode" for bright environments

---

## Journey 3: Content Creation

### Persona Reference
**Name:** Marcus Liu  
**Role:** YouTube Science Communicator  
**Background:** 31-year-old independent YouTuber with 250K subscribers. Creates 5-10 minute explainer videos on astronomy and cosmology. High technical skill; needs to iterate quickly on visuals.

### Scenario Context
Marcus is preparing a video about exoplanets and habitable zones. He needs dramatic 3D visuals of the Solar System and beyond to illustrate the concept of orbital positions and stellar radiation. He searches for visualization tools and finds Cosmos Explorer. He has 2 days to produce the video, so efficiency is critical.

### Step-by-Step Flow

1. **Searches for "3D universe visualization for video" in Google**
   - Sees Cosmos Explorer in search results with preview image of star field
   - Clicks through to landing page
   - Reads: "Interactive 3D universe for browsers" and "Free, no account needed"
   - Emotions: Interest, skepticism (Is this good enough quality? Is it easy to capture?)
   - Touchpoints: Google search result; landing page
   - Pain Points: No mention of video/content creation use; unclear if export options exist
   - Opportunity: Create a "For Content Creators" section with video export documentation

2. **Checks landing page for content creation features**
   - Looks for: Video export, screenshot capability, resolution options, rendering quality
   - Doesn't immediately see these features highlighted
   - Emotions: Mild concern, but still hopeful
   - Touchpoints: Homepage feature list; "Learn More" links (if any)
   - Pain Points: Content creation features not advertised; may need to dig into docs or try trial-and-error
   - Opportunity: Highlight screenshot/recording features on homepage; provide quick-start guide for creators

3. **Opens the tool; tests visual quality and smoothness**
   - Launches Cosmos Explorer; views default Solar System
   - Notes: smooth 60fps rendering, visually appealing star field, good planet textures
   - Thinks: "This looks professional enough for YouTube"
   - Emotions: Validation, confidence
   - Touchpoints: 3D canvas; visual rendering; frame rate (perceived)
   - Pain Points: No visible FPS counter; no way to verify resolution/quality settings
   - Opportunity: Add graphics quality settings (Low/Medium/High/Ultra); show FPS counter in debug mode

4. **Navigates to specific view: Earth and Sun, habitable zone concept**
   - Wants to show Earth in context of Solar System, with focus on sun distance
   - Positions camera: Earth in center-left of frame, Sun on right, other planets faded in background
   - Uses camera controls (drag to rotate, scroll to zoom, right-click to pan) to frame shot
   - Emotions: Creative flow, problem-solving
   - Touchpoints: Mouse/trackpad controls; 3D canvas; camera manipulation
   - Pain Points: Camera controls feel slightly imprecise; hard to lock a specific angle; no "save view" button
   - Opportunity: Add camera control presets (e.g., "Top-down," "Ecliptic plane," "From Earth"); allow manual save of camera positions

5. **Adjusts time to show seasonal/orbital variation**
   - Wants to show Earth moving in orbit around the Sun
   - Uses time slider to advance time; observes Earth's orbital motion
   - Records the slider position that looks best for intro shot
   - Emotions: Satisfying control, creative ideation
   - Touchpoints: Time slider; animated motion
   - Pain Points: Hard to replay exact time position; no keyframe or bookmark system
   - Opportunity: Add time "bookmarks" (e.g., "Autumn Equinox," custom dates); allow recording of time-lapse sequences

6. **Takes high-resolution screenshot**
   - Right-clicks to save image, or looks for a screenshot button
   - If found: screenshot exports in what resolution? (1080p? 2K? 4K?)
   - If not found: Records screen with OBS or similar tool (workaround)
   - Emotions: Frustration if no native export; satisfaction if it works
   - Touchpoints: Screenshot function (right-click or button); save dialog
   - Pain Points: Screenshot quality/resolution unclear; may not match video render target (1080p, 4K, etc.)
   - Opportunity: Add screenshot button with resolution selector (720p, 1080p, 2K, 4K); preview export quality

7. **Attempts to record a smooth fly-through animation**
   - Wants a cinematic shot: zoom from far away, focus on Earth
   - Option A: Record screen while manually manipulating camera (risky, hard to redo)
   - Option B: Check if tool has "animation" or "preset path" feature (likely doesn't)
   - Either way, Marcus records screen with OBS, narrates over it in post
   - Emotions: Resigned problem-solving, mild frustration
   - Touchpoints: OBS screen recording; camera manipulation during recording
   - Pain Points: Manual recording is error-prone; one mistake requires full re-do; no animation timeline/keyframes
   - Opportunity: Add "Animation Path" feature: set start/end camera positions + time range, then auto-play smooth interpolation; export as video

8. **Searches for data sources to cite in video**
   - Notices info panels on planets (diameter, orbital period, etc.)
   - Thinks: "Where does this data come from? I need to cite sources."
   - Looks for a "Data Sources" or "Attribution" link
   - May not find it clearly; has to infer NASA/JPL or search for tool documentation
   - Emotions: Responsible, but slightly frustrated
   - Touchpoints: Info panels; tool credits/about page (if visible)
   - Pain Points: No automatic citation generation; no BibTeX or structured data export
   - Opportunity: Add "Cite Data" button in info panels; export as BibTeX, APA, Chicago style; link to original sources

9. **Exports or screenshots multiple angles of the same scene**
   - Rotates view 90 degrees, takes another screenshot (different perspective)
   - Repeats for 3-4 different angles
   - Emails/downloads all images for use in video editing
   - Emotions: Productive, accumulating assets
   - Touchpoints: Camera manipulation; screenshot tool; file system (downloads folder)
   - Pain Points: Each screenshot requires manual repositioning; no "batch export" or "multi-view" option
   - Opportunity: Add "Camera Presets" dropdown (Front, Top, Side, Isometric) with one-click views; batch export all angles

10. **Tests audio/soundscape; decides whether to include**
    - Hears ambient procedural soundscape
    - Considers: "Should I include this in video? Or record my own narration?"
    - Notes soundscape is atmospheric, might be nice background, or might distract from narration
    - Has to decide whether to mute or include; no easy way to extract audio separately
    - Emotions: Practical decision-making
    - Touchpoints: Sound control; audio playback
    - Pain Points: Can't export audio separately from video; limited control over soundscape
    - Opportunity: Add option to export audio track separately; provide soundscape intensity slider; show audio waveform

11. **Switches to extragalactic scale to show bigger context**
   - Wants a follow-up shot: zoom out to Milky Way, then to cosmic web
   - Zooms out significantly; Solar System becomes invisible
   - Captures views of Milky Way, local group (if available), cosmic web structure
   - Emotions: Awe at scale; creative excitement
   - Touchpoints: Zoom controls; 3D canvas at different scales
   - Pain Points: Transitioning between scales is jarring; no smooth "zoom-out animation" to show scale perspective
   - Opportunity: Add "Scale Transition" animation: smooth zoom from one scale level to the next with visual cues (distance marker updates, label fades)

12. **Collects metadata for video description**
   - Needs to note: tools used, data sources, licensing, links
   - Visits about page, looks for licensing info (CC0? CC-BY? All rights reserved?)
   - Checks if tool is free for non-commercial use, commercial use, attribution-required
    - Emotions: Responsible, due diligence
    - Touchpoints: About/licensing page; external documentation
    - Pain Points: Licensing unclear; may require emailing creators; no standard open-source license mentioned
    - Opportunity: Display licensing on landing page (e.g., "CC-BY-4.0"); provide template video description snippet

13. **Prepares video script and shot list**
    - Creates written script for video narration (~5 minutes, 750 words)
    - Creates shot list: "1) Solar System overview (2s), 2) Earth zooms in (3s), 3) Habitable zone explanation graphic (4s), 4) Zoom to Milky Way (2s), 5) Cosmic web (2s)"
    - Maps Cosmos Explorer shots to each section
    - Emotions: Planning, organization, confidence
    - Touchpoints: Text editor; self-reference
    - Pain Points: None specific to tool; external work
    - Opportunity: Provide "Video Script Worksheet" template for creators planning videos with Cosmos Explorer

14. **Records all B-roll and organizes in video editor**
    - Uses OBS to record ~15-20 minutes of raw footage from Cosmos Explorer (multiple takes)
    - Imports into DaVinci Resolve or Adobe Premiere
    - Cuts and trims best shots, sequences them to match script
    - Renders video at 1080p 60fps
    - Emotions: Technical focus, creative flow, satisfaction
    - Touchpoints: OBS; video editor; render settings
    - Pain Points: None specific to Cosmos Explorer; standard video production workflow
    - Opportunity: Provide pre-made video editing templates (DaVinci, Premiere, Final Cut) with synced Cosmos Explorer shots for faster editing

15. **Publishes video; includes links and credits in description**
    - Adds to YouTube description: "Cosmos Explorer: [link], Data from NASA, JPL, etc. Licensed under..."
    - Videos gets good engagement; comments ask "What tool is that?"
    - Marcus replies with Cosmos Explorer link; drives traffic to tool
    - Emotions: Pride, satisfaction, legacy
    - Touchpoints: YouTube upload form; video description; comments
    - Pain Points: Link tracking/analytics unclear; no way to know how many viewers clicked through to Cosmos Explorer
    - Opportunity: Provide trackable referral links for content creators; show how many views/clicks came from their video

### Success Metrics
- Marcus successfully captures 5+ usable shots/videos for his YouTube video
- Video renders at desired quality (1080p 60fps minimum)
- Time to produce all Cosmos Explorer visuals: < 4 hours
- Video receives 10K+ views; comments mention Cosmos Explorer
- Referred viewers to Cosmos Explorer: > 500 clicks (if tracking available)
- Marcus publishes follow-up video using Cosmos Explorer within 3 months

### Edge Cases / Failure Modes
- **Screenshot quality is too low:** Image export defaults to 720p, but Marcus needs 4K → Provide resolution selector with 4K+ option
- **Recording frame rate drops:** During screen recording, 3D rendering stutters → Optimize rendering, provide performance mode
- **Licensing ambiguity:** Creator includes video in monetized YouTube channel, but tool's license is unclear → Clearly state "Free for commercial use" on landing page; provide explicit CC-BY license
- **Data sources are wrong:** Creator cites tool's planet data, but it's inaccurate → Implement data validation; link to authoritative sources; update regularly

---

## Journey 4: Deep Exploration Session

### Persona Reference
**Name:** Rebecca "Bex" Okonkwo  
**Role:** Amateur Astronomer  
**Background:** 52-year-old retired engineer, amateur astronomer with 20 years of hobby experience. Owns telescope, knows constellations and nebulae by name. Loves weekend stargazing and astronomy forums.

### Scenario Context
Saturday evening, Bex plans a 2-3 hour "armchair astronomy" session. She wants to explore nebulae, galaxies, and interesting cosmic objects without a specific research goal—just for the joy of discovery. She has heard Cosmos Explorer mentioned in her astronomy club and wants to use it as a tool for virtual exploration supplementing her physical telescope observations.

### Step-by-Step Flow

1. **Settles in with comfortable chair, coffee, and laptop**
   - Opens Cosmos Explorer, full-screen
   - Default view shows current Solar System (roughly current date/time)
   - Realizes tool is showing real-time positions—interesting!
   - Emotions: Comfort, anticipation, readiness for exploration
   - Touchpoints: Browser window; full-screen mode
   - Pain Points: No quick overview of "what's in view tonight"
   - Opportunity: Show "Tonight's Sky" summary (visible constellations, bright objects, events)

2. **Checks current sky position: where is everything right now?**
   - Notices date/time indicator in UI (e.g., "April 16, 2026, 7:45 PM")
   - Realizes she can use this to align with actual night sky visible from her location
   - Thinks about how to adjust view to match her dark-sky location's observing angle
   - Emotions: Curiosity, practical interest
   - Touchpoints: Date/time display; location settings (if available)
   - Pain Points: Tool may default to Earth-centered view; not clear if location is customizable
   - Opportunity: Add location selector; show "visible from your location" overlay; ask for city/coordinates on first load

3. **Navigates to bright nebula: Orion Nebula (M42)**
   - Uses search box or navigation menu to find "Orion" or "M42"
   - Searches: types "Orion Nebula" or "M42" into search bar
   - View jumps to Orion Nebula region; zooms to show nebula structure
   - Emotions: Delight at finding familiar object, satisfaction
   - Touchpoints: Search bar; navigation results; auto-zoom
   - Pain Points: If search doesn't exist, user has to manually navigate by zooming/dragging
   - Opportunity: Implement object search; support Messier catalog (M1, M42, etc.), Caldwell catalog, NGC catalog

4. **Reads info panel about Orion Nebula**
   - Info displays: Distance (1300 light-years), size, type (emission nebula), stars in it, discovery history
   - Bex reads with interest, mentally comparing to telescope view she's seen
   - Emotions: Educational engagement, nostalgia
   - Touchpoints: Info panel (read-only); detailed astronomical data
   - Pain Points: No comparison to personal observations; no historical viewing notes
   - Opportunity: Add "Observer's Notes" section; let users add personal observations linked to objects

5. **Zooms in to see nebula structure in detail**
   - Continues scrolling zoom to see filaments, hot regions, young stars within nebula
   - Adjusts camera angle (drag) to view from different perspectives
   - Realizes she can see 3D structure of nebula, not just 2D
   - Emotions: Awe, new perspective, playfulness
   - Touchpoints: Zoom controls; 3D camera manipulation
   - Pain Points: Ultra-close zoom may lose context; hard to know optimal viewing distance
   - Opportunity: Add "Preset Views" for each object (Full view, Detail view, Artist's concept); show reference distance scale

6. **Adjusts ambient sound for this viewing session**
   - Notices sound is already playing (procedural ambient)
   - Adjusts volume to soft background level (not distracting)
   - Finds the sound relaxing and immersive
   - Emotions: Comfort, immersion, contentment
   - Touchpoints: Sound control slider; audio playback
   - Pain Points: Sound may be too generic; no way to customize based on object type
   - Opportunity: Vary soundscape by cosmic region (nebula ≠ galaxy ≠ planetary); offer different "mood" tracks

7. **Bookmarks Orion Nebula as a favorite**
   - Clicks heart icon or "favorite" button in info panel
   - Receives confirmation: "Added to your favorites" (local storage, browser-based)
   - Thinks: "I can come back to this easily next time"
   - Emotions: Satisfaction, sense of control
   - Touchpoints: Favorite/bookmark button; confirmation message
   - Pain Points: Bookmarks are local/browser-based; don't sync across devices; no public sharing of favorite lists
   - Opportunity: Add account system (optional) to sync bookmarks; allow sharing favorite lists with astronomy club friends

8. **Discovers nearby object: Horsehead Nebula**
   - While at Orion, notices related object mentioned in UI (recommendation or related links)
   - Searches for "Horsehead Nebula"; navigates there
   - Views dark nebula against emission nebula background
   - Emotions: Delight at discovery, connected learning
   - Touchpoints: Related object link (or search); navigation
   - Pain Points: May not know related objects exist; no "recommended nearby objects" feature
   - Opportunity: Show "Nearby Objects" section in info panel; suggest objects based on viewing history

9. **Zooms out to galactic scale to see context**
   - Realizes Orion is in Milky Way; zooms out to see Milky Way spiral structure
   - Orion Nebula becomes tiny point; Milky Way fills view
   - Navigates to nearby galaxy: Andromeda (M31)
   - Emotions: Scale perspective, wonder, intellectual engagement
   - Touchpoints: Zoom controls; object navigation; 3D spatial context
   - Pain Points: Transitioning between vastly different scales can feel jarring
   - Opportunity: Add smooth "scale transition" animation with visual cues (distance markers, labels)

10. **Explores Andromeda Galaxy structure**
    - Zooms to see Andromeda's spiral arms, dust lanes, bright core
    - Views from different angles to understand 3D structure
    - Reads info: 2.5 million light-years away, 1 trillion stars, on collision course with Milky Way in 4.5 billion years
    - Emotions: Awe, contemplation of cosmic time scales
    - Touchpoints: 3D canvas; camera controls; info panel (educational content)
    - Pain Points: Info about collision with Milky Way may be too distant in future to feel relevant; no timeline view
    - Opportunity: Add timeline view for cosmic events (supernovae, galaxy collisions, etc.); show when events occur relative to Earth's future

11. **Zooms out further: cosmic web and large-scale structure**
    - Continues zooming out beyond galaxies
    - Sees cosmic web: strings of galaxies, filaments, voids
    - Realizes she's viewing fundamental structure of universe
    - Emotions: Profound awe, existential contemplation, humility
    - Touchpoints: Zoom controls; 3D rendering of cosmic web
    - Pain Points: Cosmic web visualization may be abstract/hard to understand; needs explanation
    - Opportunity: Add "Cosmic Web Explorer" mode with toggles for voids, filaments, galaxy clusters; educational overlay

12. **Spends time adjusting time slider to watch cosmic changes**
    - Drags time slider backward and forward
    - Watches (in fast-forward): planetary motion, orbital changes, Sun's position in sky
    - Realizes she could use this to plan future observing sessions
    - Emotions: Practical value discovery, wonder at time
    - Touchpoints: Time slider; animated cosmic motion
    - Pain Points: Extreme time scales (billions of years) may not be visually interesting; no preset time jumps
    - Opportunity: Add time-jump buttons (1 hour, 1 day, 1 month, 1 year, 10 years, 1000 years); show past/future astronomical events

13. **Bookmarks several favorite objects and views**
    - Adds to favorites: Orion Nebula, Andromeda, Pleiades cluster, Saturn
    - Each bookmark stores: object name, view angle, zoom level, time setting
    - Emotions: Curation, personal collection building
    - Touchpoints: Favorite button; bookmark list (accessible from menu)
    - Pain Points: Bookmarks list may get long; no organization/folders; no social sharing
    - Opportunity: Allow organizing bookmarks into folders (e.g., "My Favorites," "Targets for 2026," "Friends' Favorites"); share lists

14. **Takes screenshots of favorite views**
    - Right-clicks to screenshot, or uses screenshot button
    - Saves images of: Orion Nebula close-up, Andromeda edge-on view, Milky Way full structure
    - Plans to print and frame one or share with astronomy club
    - Emotions: Creative expression, pride in digital exploration
    - Touchpoints: Screenshot function; file system (saves folder)
    - Pain Points: Screenshot quality/resolution unclear; no watermark or metadata
    - Opportunity: Add "Print-ready" export option (high-res, with title/date, optional watermark); embed metadata (object name, coordinates)

15. **Ends session; feels satisfied and plans return**
    - After 2-3 hours of exploration, closes browser (or puts in sleep mode)
    - Makes mental note: "I want to explore the Crab Nebula next session"
    - Thinks about sharing Cosmos Explorer with her astronomy club next month
    - Emotions: Satisfaction, fulfillment, sense of discovery
    - Touchpoints: Browser close/sleep; internal reflection
    - Pain Points: None; session was highly successful
    - Opportunity: Send optional email reminder (if opted in) with "What's visible next week" to encourage return

### Success Metrics
- Session duration: 2-3 hours (sustained engagement)
- User bookmarks 5+ objects
- User takes 3+ screenshots
- User returns to tool within 2 weeks
- User shares about experience with astronomy club or social media
- User explores at least 3 different cosmic scales (Solar System, Milky Way, cosmic web)

### Edge Cases / Failure Modes
- **User gets lost navigating between scales:** View becomes disorienting → Add "Reset to Earth" button; show scale indicator; provide breadcrumb trail
- **Bookmarks are lost after browser cache clear:** No account/sync system → Add optional local backup (export/import JSON); suggest account creation (optional)
- **Performance degrades during long session:** Browser memory builds up → Optimize rendering; garbage collect unused assets; recommend page refresh after 2+ hours
- **User wants to share bookmarks with friend:** No public sharing; bookmarks are private → Add public share link feature; allow linking to shared collections

---

## Journey 5: Research Quick-Check

### Persona Reference
**Name:** Dr. James Chen  
**Role:** Astrophysics Researcher  
**Background:** 38-year-old postdoctoral researcher at a university. Studies galaxy clusters and large-scale structure. Comfortable with data analysis, astronomy software (like Aladin, Topcat). Needs quick visualizations to support research.

### Scenario Context
James is analyzing a galaxy cluster catalog from recent survey data. He needs to quickly visualize the 3D spatial distribution of galaxies in a specific region to better understand the cluster's morphology. He has heard about Cosmos Explorer but isn't sure if it can handle research-level queries. He has ~30 minutes to assess whether the tool is useful for his work.

### Step-by-Step Flow

1. **Opens Cosmos Explorer in browser tab while reviewing catalog data**
   - Has galaxy cluster catalog open in another window (list of coordinates, redshifts, masses)
   - Opens Cosmos Explorer as a supporting visualization tool
   - Sees default Solar System view; immediately thinks "I need to navigate to extragalactic scale"
   - Emotions: Purposeful, slightly skeptical (is this too simple for research?)
   - Touchpoints: Browser tab switching; two applications side-by-side
   - Pain Points: Default view is galactic, not extragalactic; no obvious way to input coordinates
   - Opportunity: Allow opening with URL parameters (e.g., "?ra=10:00:00&dec=+20:00:00&z=0.1") to jump to research coordinates

2. **Searches for galaxy cluster by name or coordinates**
   - Wants to navigate to Coma Cluster (Abell 1656)
   - Tries searching by cluster name in search bar
   - If search exists: finds cluster, jumps to view
   - If not: has to manually navigate by coordinates/zoom
   - Emotions: Hope, then possible frustration if search limited
   - Touchpoints: Search bar; navigation result
   - Pain Points: No research-level search; no support for astronomical catalog names (Abell, ACO, etc.)
   - Opportunity: Support catalog searches (Abell cluster names, NGC objects, Gaia source IDs); allow coordinate input (RA/Dec)

3. **Navigates to extragalactic scale (z ~ 0.02 for nearby cluster)**
   - Zooms out to show cosmic web
   - Cluster of galaxies becomes visible as a concentration of points
   - Thinks: "Good—the tool shows the structures I'm interested in"
   - Emotions: Validation, growing interest
   - Touchpoints: Zoom controls; 3D canvas showing galaxy positions
   - Pain Points: No redshift (distance) scale selector; unclear how far tool zooms extragalactic
   - Opportunity: Add redshift (z) selector or distance scale control; label distance in light-years or Mpc

4. **Attempts to overlay catalog data onto visualization**
   - Wants to plot his own galaxy catalog (from research data) on top of Cosmos Explorer view
   - Looks for: import, upload, data overlay option
   - If exists: uploads CSV or fits file with galaxy coordinates, magnitudes
   - If not: realizes tool may not support this research feature
   - Emotions: Hopeful but prepared for limitation
   - Touchpoints: Import/upload button (if available); file selection dialog
   - Pain Points: Tool may not support custom data import; would limit research applicability
   - Opportunity: Add CSV/FITS import; allow plotting custom galaxy positions, colors by property (mass, redshift, stellar mass)

5. **Adjusts visualization parameters**
   - If catalog overlay works, adjusts display options:
     - Point size (scale by luminosity?)
     - Color (code by redshift, mass, or other property)
     - Transparency/opacity (show overlapped points)
   - Experiments with visualization settings
   - Emotions: Scientific engagement, exploratory analysis
   - Touchpoints: Settings panel; visualization controls; color scale legend
   - Pain Points: May be limited customization; designed for general audience, not researchers
   - Opportunity: Add advanced options (color by property, size scaling, data normalization); show statistics (N objects, mean redshift, etc.)

6. **Assesses cluster morphology and 3D structure**
   - Rotates view to see 3D arrangement of galaxies
   - Identifies: central concentration, substructure, elongation
   - Thinks: "Is this cluster relaxed or merging? The 3D view helps me assess."
   - Emotions: Scientific insight, analytical satisfaction
   - Touchpoints: Camera controls (drag to rotate); 3D canvas
   - Pain Points: No measurement tools; can't easily quantify elongation or concentration
   - Opportunity: Add measurement tools (distance between objects, volume selection, concentration metric)

7. **Takes screenshot for research notes/presentation**
   - Right-clicks to save image; exports at reasonable resolution (1080p+)
   - Adds to research notebook or presentation slide
   - Thinks: "Good for discussion section or presentation"
   - Emotions: Practical value, satisfaction
   - Touchpoints: Screenshot function; file system
   - Pain Points: No automatic citation generation; would need to manually cite in figure caption
   - Opportunity: Add caption auto-generation: "Galaxy cluster [name] from [catalog] visualized in Cosmos Explorer. Coordinates: [RA/Dec]. Data source: [linked]."

8. **Exports view data for computational follow-up**
   - Wants to export: camera position, visible galaxy coordinates, redshifts, for use in own analysis software
   - Looks for export button (JSON, CSV, or fits format)
   - If available: exports; opens in Python or R for further analysis
   - If not available: manually notes coordinates, finds in own catalog
   - Emotions: Frustrated if no export; satisfied if export works
   - Touchpoints: Export button (if exists); file save dialog
   - Pain Points: May not have research-level export; limited data formats
   - Opportunity: Export visible objects as CSV/JSON with properties (ID, RA, Dec, z, magnitude, etc.); include camera metadata

9. **Checks data provenance and accuracy**
   - Wants to know: Where did these galaxy positions come from? Are they accurate? How current?
   - Looks for "Data Sources" or "About" page mentioning catalog/survey
   - May find: references to Gaia, Sloan Digital Sky Survey, 2Mass, etc.
   - Assesses: "Is this reliable enough to cite in a research paper?"
   - Emotions: Scientific rigor, due diligence
   - Touchpoints: Data sources page; external links to surveys
   - Pain Points: May not be clear; may need to reverse-engineer data sources
   - Opportunity: Publish data provenance document; cite surveys explicitly; show data publication dates; include version control

10. **Compares tool's data with published results**
    - Recalls cluster parameters from literature (known positions, masses, redshifts)
    - Checks tool's visualization against published morphology (from X-ray images, lensing maps, etc.)
    - Thinks: "Does the tool's view match reality? Or is it simplified?"
    - Emotions: Critical assessment, scientific evaluation
    - Touchpoints: Info panels with cluster properties; external literature reference (mental)
    - Pain Points: May not have all detailed properties; simplified rendering vs. real data
    - Opportunity: Link to published papers about observed objects; show comparison images (telescope vs. Cosmos Explorer)

11. **Tests API or programmatic access (if available)**
    - Checks if tool has a REST API for querying object positions, properties
    - Reads documentation: can I call the tool via Python script to get coordinates?
    - If available: validates API, plans to integrate into research workflow
    - If not: accepts tool as visualization-only, not data retrieval
    - Emotions: Practical assessment, planning integration
    - Touchpoints: API documentation (if exists); code examples; HTTP requests (if testing)
    - Pain Points: No API mentioned; tool designed as GUI, not research tool
    - Opportunity: Publish REST API for researchers (query objects, get properties, export coordinates); provide SDKs for Python, JavaScript

12. **Assesses time efficiency of tool vs. alternatives**
    - Compares Cosmos Explorer to other tools: Aladin, Topcat, VizieR, custom scripts
    - Thinks: "Is this faster than my usual workflow? Can I integrate it?"
    - Concludes: "Good for quick visual check. Not a replacement for full research tools, but useful supplement."
    - Emotions: Pragmatic, satisfied with niche use
    - Touchpoints: Mental comparison of workflows
    - Pain Points: Tool has limitations for research; not designed as primary analysis tool
    - Opportunity: Position as complementary research tool; provide integration guides with Aladin, Python ecosystem

13. **Decides on tool's applicability to his research**
    - Determines: Yes, useful for visual exploration and presentations. No, not suitable for precise measurements.
    - Makes note: "Use Cosmos Explorer for: cluster morphology sketches, presentation figures. Use Aladin/Topcat for precise analysis."
    - Thinks about mentioning to collaborators
    - Emotions: Clarity, acceptance of tool's role
    - Touchpoints: Internal decision-making; email to collaborators (future action)
    - Pain Points: Tool is limited compared to full research software; needs complementary tools
    - Opportunity: Publish use cases document for researchers; show integration with other tools

14. **Documents findings in research notebook**
    - Makes brief note in lab notebook or digital research log:
      "Coma Cluster visualization: Central concentration evident; possible substructure; 3D view helpful for morphology assessment. Tool: Cosmos Explorer [link]."
    - Bookmarks Cosmos Explorer for future use (when quick visual check is needed)
    - Emotions: Productive, thorough
    - Touchpoints: Research notebook (digital or paper); browser bookmark
    - Pain Points: None; documentation is straightforward
    - Opportunity: Provide researcher-friendly templates for documenting Cosmos Explorer-assisted findings

15. **Provides feedback to tool developers (optional)**
    - If survey/feedback form available: fills out brief feedback
    - Suggests: "Add coordinate input, research-level export, catalog overlay"
    - Mentions tool was useful but has limitations
    - Emotions: Helpful, constructive
    - Touchpoints: Feedback form (if available); email to developers
    - Pain Points: No clear feedback channel; may not know how to report suggestions
    - Opportunity: Add prominent feedback button; create community forum for researchers; maintain public roadmap

### Success Metrics
- James completes visual assessment of galaxy cluster morphology in < 30 minutes
- Tool provides new insight vs. existing analysis (e.g., 3D perspective on cluster structure)
- James returns to tool for at least 2 more research quick-checks within semester
- James mentions Cosmos Explorer in lab meeting or collaborator conversation
- Feedback is incorporated into tool (if relevant to broader researcher use case)

### Edge Cases / Failure Modes
- **Catalog data is outdated or inaccurate:** Galaxy cluster positions don't match published surveys → Implement data validation; prominently state data age and source
- **User can't import custom catalog:** Upload feature missing → Provide workaround: generate coordinate links (URL parameters); document for researchers
- **Precision is insufficient for research:** Tool rounds coordinates or has limited resolution → Document precision limits in technical specs; state use case suitability
- **No programmatic access:** API doesn't exist, preventing integration → Publish API roadmap; invite researcher input on API design

---

## Journey 6: Mobile Casual Browse

### Persona Reference
**Name:** Priya Sharma  
**Role:** High School Student  
**Background:** 16-year-old with casual interest in space; spends time on social media; not an astronomy enthusiast, but curious. Good with smartphones.

### Scenario Context
Priya's friend sends her a link to Cosmos Explorer via WhatsApp: "Look at this crazy space thing lol." She opens it on her phone during her morning commute (train ride, 20-30 minutes). No expectation for deep engagement; just checking out what her friend shared.

### Step-by-Step Flow

1. **Receives WhatsApp link from friend**
   - Friend's message: "Check this out - https://cosmosexplorer.app | so cool"
   - Priya clicks the link; opens in Safari/Chrome on her iPhone
   - Page begins loading
   - Emotions: Casual curiosity, trust in friend's recommendation
   - Touchpoints: WhatsApp link; browser opening
   - Pain Points: Mobile redirects/responsive design may be slow; page may be desktop-optimized
   - Opportunity: Ensure instant mobile redirect; show "Loading universe..." placeholder that's visually engaging

2. **Landing page loads on mobile (vertical viewport)**
   - Hero section auto-scales to portrait orientation
   - Tagline and CTA button are readable and tappable
   - May see carousel auto-playing
   - Emotions: Initial appeal, intrigue
   - Touchpoints: Mobile landing page; CTA button
   - Pain Points: Text may be small; images may load slowly on mobile; button may be awkwardly positioned
   - Opportunity: Mobile-first design; larger touch targets (48px minimum); test on 4-5 inch and 6+ inch phones

3. **Taps "Launch Explorer" / "Open App"**
   - Button click triggers load of 3D canvas
   - Takes 3-4 seconds on decent 4G/LTE connection
   - Shows loading bar or spinner
   - Emotions: Impatience, anticipation
   - Touchpoints: Loading indicator; progress feedback
   - Pain Points: Mobile data is slower; loading may timeout; no patience for > 5 seconds
   - Opportunity: Optimize mobile bundle size; show tips/fun facts during load ("Did you know? Saturn has 146 moons"); enable offline fallback (low-poly version)

4. **3D view loads on mobile screen**
   - Small screen (portrait): Solar System with Sun and planets visible
   - UI chrome (sidebar, buttons) scaled to mobile
   - Touch-friendly
   - Emotions: Amazement at 3D on phone, "this is so cool"
   - Touchpoints: 3D canvas; mobile UI
   - Pain Points: Screen crowding; small planet sizes; hard to tap small UI elements
   - Opportunity: Hide sidebar by default on mobile; show "hamburger menu" (☰); ensure minimum touch target size (48px)

5. **Rotates phone to landscape to see 3D better**
   - Flips phone horizontally; view re-orients to landscape
   - More horizontal canvas space; sees planets more clearly
   - Realizes landscape is much better for 3D
   - Emotions: Discovery, improvement
   - Touchpoints: Device rotation; responsive layout
   - Pain Points: UI may not adapt well to landscape; accidental rotation may happen
   - Opportunity: Lock to landscape for Cosmos Explorer; ask user "Rotate for best experience"; remember preference

6. **Uses touch gesture to interact: tap on a planet**
   - Taps on Saturn (visible in center of screen)
   - Planet name/info appears (tooltip or small panel)
   - Realizes "I can tap things"
   - Emotions: Delight, intuitive control
   - Touchpoints: Planet mesh (tappable); info display
   - Pain Points: Info panel may be tall on small screen; no "close" button visible
   - Opportunity: Show info in bottom sheet (slides up from bottom) on mobile; tap background to close

7. **Uses pinch gesture to zoom**
   - Places two fingers on screen; pinches outward (or together) to zoom
   - Smoothly zooms in/out on Solar System
   - Enjoys the tactile control
   - Emotions: Control, playfulness, engagement
   - Touchpoints: Pinch gesture; zoom animation
   - Pain Points: Pinch may accidentally trigger other gestures; momentum scrolling may overshoot
   - Opportunity: Implement inertial zoom (smooth deceleration); lock other gestures while zooming

8. **Drags to rotate the view**
   - One finger swipe/drag on canvas to rotate
   - Smoothly rotates view; see planets from different angles
   - Experiments with different rotation angles
   - Emotions: Joy, playfulness
   - Touchpoints: Drag gesture; rotation animation
   - Pain Points: Drag may be too sensitive; accidental drags (from scrolling page) may interfere
   - Opportunity: Implement gesture recognition to distinguish drag-to-rotate from page scroll; tune sensitivity

9. **Reads info panel about a planet (e.g., Jupiter)**
   - Panel displays: name, size, color, interesting fact ("Jupiter has a Great Red Spot")
   - Info is concise and engaging (not too technical)
   - Emotions: Learning, engagement
   - Touchpoints: Info panel text
   - Pain Points: Text may be too small; no rich media (images, videos) in info
   - Opportunity: Include emoji-tagged facts (e.g., "🌪 Has storms bigger than Earth"); add optional short video or link to more details

10. **Scrolls down to see more info about planet (if panel is long)**
    - Info panel may be scrollable if too tall for screen
    - Scroll inside panel without closing it
    - Emotions: Smooth continuation, discovery
    - Touchpoints: Scrollable info panel
    - Pain Points: May accidentally scroll the canvas instead of panel; gesture conflicts
    - Opportunity: Clarify which area scrolls by visual separation; add scroll indicator

11. **Presses share button to forward to friends**
    - Sees share icon (often integrated with info panel)
    - Taps "Share"
    - Native share sheet appears (iOS: iCloud, Messages, Mail, etc.; Android: similar)
    - Taps "Messages" to send to another friend
    - Message includes Cosmos Explorer link (and maybe Jupiter screenshot)
    - Emotions: Social engagement, viral sharing
    - Touchpoints: Share button; native OS share sheet; Messages app
    - Pain Points: Native share sheet may not have all friends; app may not preserve link in message cleanly
    - Opportunity: Implement in-app sharing with direct links; shorten URLs; add custom share message ("Check out [planet]!")

12. **Taps to return to main view (close info panel)**
    - Closes info panel (taps background or X button)
    - Back to 3D view of planets
    - Emotions: Readiness for more exploration
    - Touchpoints: Background tap or close button
    - Pain Points: Close button may be hard to find on small screen
    - Opportunity: Use universal close affordance (tap anywhere outside panel, or swipe down); make it intuitive

13. **Explores another object: taps Moon**
    - Finds Moon orbiting Earth
    - Taps Moon; sees small info panel about it
    - Learns: "Moon orbits Earth every 27.3 days"
    - Emotions: Continuing engagement, casual learning
    - Touchpoints: Moon mesh; info panel
    - Pain Points: Moon may be hard to click (small target); may accidentally hit Earth instead
    - Opportunity: Zoom in on Earth-Moon system for easier interaction; provide planet labels with tap-to-select menu

14. **Glances at clock; realizes commute is almost over**
    - Realizes train is pulling into station in 5 minutes
    - Wants to bookmark Cosmos Explorer for later
    - Taps browser bookmark button; adds to bookmarks
    - Emotions: Satisfaction, plans to revisit
    - Touchpoints: Browser bookmark feature; bookmarks menu
    - Pain Points: May not know how to bookmark; may need account to sync bookmarks across devices
    - Opportunity: Add in-app bookmark (local); suggest creating free account for sync (optional); show "Save to Home Screen" (PWA)

15. **Closes app and responds to friend**
    - Returns to WhatsApp
    - Types reply: "Haha so cool! I can zoom around the whole solar system 🚀 you can tap things and it tells you facts"
    - Sends emoji-filled message
    - Emotions: Satisfied, socially engaged, fun experience
    - Touchpoints: WhatsApp message composition
    - Pain Points: None; natural social engagement outcome
    - Opportunity: Enable in-app sharing directly to WhatsApp (if permission granted); show "share your favorite discovery" prompts

### Success Metrics
- Mobile session completes without technical errors: 100% success
- User engages with 3+ interactive elements (tap, zoom, rotate)
- Time to first interaction: < 10 seconds
- User bookmarks or shares link (at least one action)
- Session duration: 5-10 minutes (fits commute)
- User returns via mobile within 2 weeks
- Friend receives shared link and opens it (if trackable)

### Edge Cases / Failure Modes
- **Loading time exceeds 10 seconds on 4G:** User gives up and closes → Implement aggressive mobile optimization (lower poly count, smaller textures, lazy load); show retry option
- **3D rendering is too slow on older phone:** Frame rate drops to < 20fps → Detect performance; auto-downgrade to lower-poly or 2D mode
- **Landscape view breaks UI layout:** Controls become unusable → Ensure responsive breakpoints; test on 3-4 device sizes
- **Info panel too tall on small screen:** Text is cut off → Use bottom-sheet pattern; implement scrollable content; test on iPhone SE (smallest modern phone)
- **Touch gestures conflict:** Pinch zooms page instead of canvas → Ensure proper touch event handling; disable browser zoom on content

---

## Journey Map Summary Table

| Journey | Persona | Primary Goal | Duration | Key Touchpoints | Success Metric | Failure Mode |
|---------|---------|--------------|----------|-----------------|----------------|--------------|
| 1: First-Time Discovery | Alex Chen (Space Enthusiast) | Explore universe in awe; share with friends | 10-30 min | Landing page, 3D canvas, info panels, share buttons | Return within 7 days | WebGL unsupported; slow loading |
| 2: Classroom Lesson | Dr. Sarah Morrison (Teacher) | Plan and deliver astronomy lesson using tool | 1 hour planning + 30 min demo | Landing page, Solar System view, time slider, fullscreen, info panels | Students understand Kepler's Laws | Projector incompatibility; internet outage |
| 3: Content Creation | Marcus Liu (YouTuber) | Capture 3D visuals for science video | 2-4 hours | Screenshot tool, camera controls, time slider, animation paths, data sources | 5+ usable shots; publish video; >500 referred viewers | Screenshot quality too low; missing animation keyframes |
| 4: Deep Exploration | Rebecca Okonkwo (Amateur Astronomer) | Virtual stargazing; discover objects; immerse | 2-3 hours | Search function, zoom controls, info panels, bookmarks, sound controls | 5+ bookmarks; 3+ screenshots; return within 2 weeks | Disorienting scale transitions; bookmarks lost on cache clear |
| 5: Research Quick-Check | Dr. James Chen (Researcher) | Visualize galaxy cluster morphology; assess tool | 20-30 min | Search/coordinate input, overlay data, export options, data provenance | Visual assessment completes; tool integrated into workflow | Catalog upload unavailable; coordinate precision insufficient |
| 6: Mobile Casual Browse | Priya Sharma (High School Student) | Check friend's link; casual exploration | 5-10 min | Mobile landing page, 3D canvas, touch gestures, info panels, share buttons | Bookmark or share; return within 2 weeks | Loading time >10 sec; rendering too slow on older phone |

---

## Critical Moments of Truth

These are make-or-break points that determine success or failure across multiple journeys:

### 1. **Initial Load / First 3D Render (All Journeys)**
- **The Moment:** User sees 3D universe appear for the first time after clicking "Launch"
- **What Users Expect:** Immediate visual spectacle (stars, planets, or nebulae); smooth performance
- **What Can Go Wrong:** Slow loading (>5 sec), blank screen, WebGL error, low-poly appearance disappoints
- **Opportunity:** Optimize load time <3 sec; show engaging loading animation; default to visually striking scene (e.g., Saturn with rings)
- **Recovery:** Clear error message + retry button; suggest browser upgrade if WebGL unsupported

### 2. **First Interaction (Journeys 1, 6)**
- **The Moment:** User performs first gesture/click (drag, zoom, tap planet)
- **What Users Expect:** Responsive, intuitive control; visual feedback; smooth animation
- **What Can Go Wrong:** No response, lag, confusing behavior, gesture conflicts
- **Opportunity:** Provide subtle onboarding ("Drag to rotate, click for info"); ensure <50ms response time; show visual feedback
- **Recovery:** Auto-show tutorial; detect inactivity and prompt interaction

### 3. **Information Discovery (Journeys 1, 2, 4, 6)**
- **The Moment:** User clicks object and sees info panel; reads facts
- **What Users Expect:** Relevant, accurate, engaging information; clear sources
- **What Can Go Wrong:** Wrong object clicked; info is inaccurate; sources unclear; text too small/technical
- **Opportunity:** Increase click targets; ensure accuracy; cite data sources; use clear, accessible language
- **Recovery:** Show what was clicked; provide glossary for technical terms; link to reliable sources

### 4. **Sharing Moment (Journeys 1, 3, 6)**
- **The Moment:** User clicks share; link is generated; sent to friend/social media
- **What Users Expect:** Easy sharing; link preserves view state; friend sees same scene
- **What Can Go Wrong:** Link doesn't work; doesn't preserve state; privacy concerns; complicated process
- **Opportunity:** Test share links thoroughly; include view parameters in URL; show preview before sharing
- **Recovery:** Provide alternative share methods (copy link, email, QR code); easy resend if link breaks

### 5. **Scale Transition / Zoom to Extragalactic (Journeys 1, 4, 5)**
- **The Moment:** User zooms from Solar System to Milky Way to cosmic web
- **What Users Expect:** Smooth progression; maintained orientation; clear scale indicators
- **What Can Go Wrong:** Jarring jump; user feels lost; unclear what they're viewing
- **Opportunity:** Implement smooth zoom animation; show "You are here" marker; update labels continuously
- **Recovery:** Add zoom reset button; show scale ladder (Earth → Solar System → Galaxy → Cosmic Web)

### 6. **Research/Data Accuracy (Journeys 2, 5)**
- **The Moment:** Teacher or researcher uses tool to present/analyze data; trusts numbers
- **What Users Expect:** Accurate, current, citable data; clear provenance
- **What Can Go Wrong:** Data is outdated, inaccurate, or unsourceable; undermines credibility
- **Opportunity:** Cite authoritative sources (NASA, JPL, Gaia, SDSS); show data publication date; implement versioning
- **Recovery:** Provide data validation tool; update regularly; allow manual data correction submission

### 7. **Mobile Performance (Journey 6)**
- **The Moment:** Mobile user opens on cellular connection; interacts with 3D
- **What Users Expect:** Fast load; smooth interactions; responsive UI
- **What Can Go Wrong:** Loading >10 sec; frame rate drops; touch gestures unresponsive; UI too cramped
- **Opportunity:** Aggressive optimization (lower poly, smaller textures); mobile-first design; gesture-friendly controls
- **Recovery:** Offer low-poly mode; show retry on timeout; implement fallback 2D viewer

### 8. **Content Creator Export (Journey 3)**
- **The Moment:** YouTuber/creator exports screenshots or recordings for video production
- **What Users Expect:** High-resolution output; flexible formats; easy iteration
- **What Can Go Wrong:** Screenshot too low-res; no batch export; format incompatible with editor
- **Opportunity:** Offer 4K screenshot export; preset camera angles for multi-angle export; support common video formats
- **Recovery:** Document workarounds (e.g., screen recording with OBS); provide editing templates

---

## Design Implications

These user journeys reveal critical insights about Cosmos Explorer's design and development priorities:

### 1. **Onboarding Must Be Contextual and Light**
- *Finding:* First-time users (Journeys 1, 6) need quick orientation without overwhelming; classroom teachers (Journey 2) need lesson-specific guidance; researchers (Journey 5) need advanced features discoverable but not intrusive
- *Implication:* Design different onboarding paths:
  - **Casual users:** Simple tooltips (1-2 steps), auto-dismiss after interaction
  - **Educators:** "Educator Mode" with lesson plan templates, discussion prompts, classroom setup checklist
  - **Researchers:** "Advanced Mode" toggle revealing API docs, data import, export options, technical specifications
- *Action Items:* Implement user type detection (via onboarding quiz or explicit selection); conditional UI rendering

### 2. **Mobile-First Design is Essential**
- *Finding:* 20-30% of users will access via mobile (Journey 6); mobile users have <5 min engagement window; touch interactions are primary
- *Implication:* Desktop-first UI is insufficient; mobile must be equal citizen:
  - Touch targets ≥ 48px; avoid hover-only UI
  - Responsive layout: hide sidebar by default, use hamburger menu
  - Optimize bundle size <2MB for fast loading on cellular
  - Test on variety of screen sizes (4", 5.5", 6.5")
- *Action Items:* Implement mobile breakpoints; test on real devices; set performance budget

### 3. **Sharing is a Core Feature**
- *Finding:* Users across journeys want to share (Journeys 1, 3, 4, 6); sharing drives viral adoption and word-of-mouth; shared links must preserve view state
- *Implication:* Make sharing prominent and frictionless:
  - Share button in every context (info panels, main UI, fullscreen)
  - Generate URL with view parameters (?object=Saturn&scale=Solar System&date=2026-04-16)
  - Support multiple share targets (social media, direct message, QR code)
  - Show preview of what friend will see
- *Action Items:* Implement URL state preservation; test share links across platforms; add analytics tracking for referred users

### 4. **Data Accuracy and Sources Are Trust Builders**
- *Finding:* Teachers (Journey 2) and researchers (Journey 5) will only use tool if data is accurate and sourced; content creators (Journey 3) need citations for videos
- *Implication:* Data credibility must be transparent:
  - Link to authoritative sources (NASA, JPL, Gaia, SDSS, etc.) in info panels
  - Show data publication date and version
  - Implement data validation and update schedule
  - Provide "Cite Data" button with BibTeX, APA, Chicago formats
- *Action Items:* Audit all data sources; publish provenance document; add citation UI; set up data update schedule

### 5. **Bookmarking and Favorites Drive Return Visits**
- *Finding:* Users who bookmark/favorite objects (Journeys 4, 5, 6) are more likely to return; bookmarks enable curation and social sharing
- *Implication:* Bookmarking must be low-friction and persistent:
  - Heart/star icon in every object info panel
  - Bookmarks persist locally (browser) or via optional account
  - Allow organizing bookmarks into folders/playlists
  - Enable sharing bookmark collections with friends/class
- *Action Items:* Implement local storage bookmarks; add optional account sync; create bookmark sharing feature

### 6. **Flexible Zoom and Scale Navigation Prevents User Loss**
- *Finding:* Scale transitions (Solar System → Galaxy → Cosmic Web) are awe-inspiring but disorienting (Journeys 1, 4); users need clear orientation aids
- *Implication:* Navigation must provide context and recovery:
  - Smooth zoom animations (not jarring jumps)
  - Continuous scale labels ("You are here: 1 AU from Sun")
  - Scale ladder/breadcrumb: Earth → Solar System → Milky Way → Cosmic Web
  - "Reset to Earth" button always visible
- *Action Items:* Implement scale transition animations; add scale indicator UI; implement undo/reset navigation

### 7. **Time Control Enables Multiple Use Cases**
- *Finding:* Time slider is used differently by each user type: teachers simulate orbital mechanics (Journey 2), explorers watch cosmic dance (Journey 4), researchers assess time-dependent phenomena (Journey 5)
- *Implication:* Time control must be flexible and clearly labeled:
  - Current time defaults to "now"; allow manual date/time input
  - Time speed indicator ("1 day per second"; "1 year per second")
  - Preset buttons: +1 hour, +1 day, +1 month, +1 year, +10 years
  - Ability to record/replay time sequences
- *Action Items:* Enhance time slider with labels and presets; add date/time input; implement keyframe recording

### 8. **Different Content Levels Serve Different Audiences**
- *Finding:* High school students (Journey 6) want simple fun facts; teachers (Journey 2) want educational content; researchers (Journey 5) want technical details
- *Implication:* Information must be adaptable by audience:
  - Difficulty toggle: "Basic" vs. "Advanced" info
  - Glossary for technical terms
  - Links to Wikipedia, NASA, scientific papers for deeper learning
  - Optional "Did you know?" fun facts separate from technical data
- *Action Items:* Audit content for different reading levels; implement difficulty toggle; add glossary; link to learning resources

### 9. **Accessibility Must Be Designed, Not Added**
- *Finding:* All journeys span broad audience (ages 16-60+, varying abilities); mobile users need large text (Journey 6); classroom projector users need contrast (Journey 2)
- *Implication:* Accessibility is integral:
  - Text size adjuster (12pt-18pt+)
  - High-contrast mode for visibility
  - Keyboard navigation (for non-mouse users)
  - Alt-text on images, screen-reader support
  - Colorblind-friendly palettes
- *Action Items:* Implement WCAG 2.1 AA standards; test with screen readers; conduct accessibility audit

### 10. **Export and Integration Enable Professional Use**
- *Finding:* Content creators (Journey 3) need screenshot/video export; researchers (Journey 5) want API access; teachers (Journey 2) want offline capability
- *Implication:* Export and integration must be comprehensive:
  - Screenshot export: multiple resolutions (1080p, 2K, 4K), with/without UI
  - Video export: pre-recorded animations at 60fps
  - Data export: CSV, JSON, FITS formats for research
  - REST API for programmatic access (for researchers)
  - Offline mode: downloadable star database for classrooms without internet
- *Action Items:* Implement screenshot export with resolution options; design and publish REST API; create offline PWA version

### 11. **Classroom Mode Addresses Educator-Specific Needs**
- *Finding:* Teachers (Journey 2) have unique requirements: no distracting sound, high contrast for projectors, ability to annotate and pause, lesson integration
- *Implication:* Add "Classroom Mode" preset:
  - Auto-mute sound on launch (can be re-enabled)
  - Higher contrast, larger fonts
  - Lesson plan templates aligned with standards (NGSS, AP)
  - Guided discovery sequences (students follow step-by-step)
  - Optional offline download for reliable classroom use
  - Projector compatibility checklist
- *Action Items:* Design "Classroom Mode" UI; create lesson plan templates; test on classroom projectors; publish setup guide

### 12. **Analytics and Feedback Drive Continuous Improvement**
- *Finding:* Each journey reveals different user needs; ongoing feedback is essential for prioritization
- *Implication:* Track and learn from user behavior:
  - Analytics: which objects are most-viewed, average session duration per journey type, share rates, return rates
  - Feedback channels: in-app surveys (light, contextual), feedback form, email for researchers/educators
  - Public roadmap: show what's coming, gather community input
  - A/B testing: test UI changes with small user groups before rollout
- *Action Items:* Implement analytics (privacy-respecting); add feedback button; create public roadmap; establish user research process

---

## Conclusion

These six user journeys map the diverse ways Cosmos Explorer serves audiences from casual curious explorers to serious researchers and educators. Success requires balancing simplicity for first-time users with depth for power users, ensuring data accuracy and beautiful visuals, and designing for mobile and classroom contexts alongside desktop discovery.

The critical moments of truth—first load, first interaction, information discovery, sharing, scale transitions, data accuracy, mobile performance, and content export—must each be defended with intentional design choices and rigorous testing. The design implications flow from these journeys and should drive product roadmap priorities.

By centering these journeys in ongoing product development, Cosmos Explorer can evolve to serve its full user spectrum: delighting casual explorers, empowering educators, enabling content creators, and supporting researchers.

---

**Document Prepared For:** Cosmos Explorer Product Team  
**Intended Use:** Product design, roadmap prioritization, UX research, engineering requirements  
**Next Steps:** Share with team, validate assumptions with user interviews, prioritize design implications, track success metrics per journey
