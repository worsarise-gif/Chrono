
## 2024-05-18 - Dynamic ARIA Label for Mode Selector
**Learning:** When a button's primary visual text content is dynamic and descriptive (like the current mode in a dropdown toggle), it is crucial for its `aria-label` to also dynamically reflect that current state, rather than just a static "Toggle mode" description. This provides parity between sighted users and screen reader users regarding the current state of the UI element before they interact with it.
**Action:** Always ensure that `aria-label` attributes on dynamic toggles/selectors interpolate the current state variable if the visual text conveys that state.
