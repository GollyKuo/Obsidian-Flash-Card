<task_instruction>
  <version>v1.1</version>
  <objective>Build the "AI-Enriched Flashcards" Obsidian plugin with strict CSS isolation and RemNote-inspired logic.</objective>

  <tech_stack>
    - Framework: React 18
    - Styling: Tailwind (Prefix: 'fc-', Preflight: false) + PostCSS PrefixWrap (#fc-plugin-root)
    - Icons: Lucide-React
    - AI: Gemini 3 Flash SDK (@google/generative-ai)
    - Storage: External JSON at `_Flashcards/data.json`
  </tech_stack>

  <milestones>
    <m1>Setup sandbox environment, PostCSS isolation, and CSS rules to hide "^fc-" IDs.</m1>
    <m2>Implement Flashcard Parser with "On Blur" ID generation logic and indentation support.</m2>
    <m3>Develop Notion-style HUD (Heads-Up Display) using CM6 View Plugin to show mastery icons at line ends.</m4>
    <m4>Integrate Gemini 3 Flash for Manual Enrichment and Batch Requesting.</m5>
    <m5>Build Review Modal with FSRS logic and 4-button low-saturation UI.</m6>
  </milestones>

  <implementation_details>
    - **ID Persistence**: Use `nanoid(6)` for ^fc-xxxx IDs.
    - **Context Awareness**: Automatically pass H1-H6 headers and parent indentation to AI as context.
    - **Asset Management**: Save AI images/audio to `_Flashcards/Assets/`.
    - **Cleaning Tool**: Implement a settings toggle to strip all Block IDs and return notes to pure Markdown.
  </implementation_details>

  <action>Initialize project structure and implement M1 & M2 as the first sprint.</action>
</task_instruction>