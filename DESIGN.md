# TaskFlow visual system

## Direction

TaskFlow borrows the grammar of a studio vu-meter bridge: work is measured by movement through a project, with clear channels, signal marks and a calm instrument-like rhythm. The interface stays warm and human rather than presenting implementation details as product value.

## Color roles

- Ink `#17181b`: navigation, hero surfaces, strong text and high-contrast actions.
- Warm ivory `#f5f0e7`: page canvas, primary light surfaces and inverse text.
- Coral signal `#ef6b54`: primary action, active signal and attention states.
- Amber marker `#e8b34d`: secondary status and user identity.
- Sage completion `#83a978`: completed work and live state.
- Walnut neutrals `#dcd2c3` / `#e5ddd0`: quiet panels, instrument bodies and supporting surfaces.

## Typography

Inter is the readable workhorse across the product. JetBrains Mono is reserved for measured labels, status marks and compact activity data. Headings use strong weight, short line lengths and tight tracking; body copy stays comfortably readable.

## Components

- Navigation uses a dark square mark, rounded links and a compact account rail. It says “Mes tableaux” and avoids backend vocabulary.
- The home hero is a dark instrument panel paired with a multi-channel board preview. Coral is the only urgent accent.
- Feature sections use asymmetrical compositions, authored SVG illustrations and one larger visual panel instead of a repeated card grid.
- Kanban columns keep their own color marker and accept arbitrary project-defined slugs. Cards keep attachments and subtasks close to the task title.
- File previews use a focused modal: images and PDFs are inline; text files render as readable content; Office files stay accessible through open/download actions.

## Motion and responsive behavior

The home console rises once on load and meter needles breathe subtly. Reduced-motion users receive static states. On narrow screens, the console becomes horizontally scrollable while the surrounding story collapses to one column; actions remain full-width and easy to reach.

## Content rules

Keep the home page focused on flexible workflows, task context and visible progress. Do not surface JWT, GraphQL, endpoints or internal logging as marketing copy. Technical activity remains available only inside the project board.
