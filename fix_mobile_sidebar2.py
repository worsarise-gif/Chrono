filepath = 'src/components/Sidebar.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# Let's fix that logic since the previous one didn't replace because the old string didn't match.
# Wait, let me check the exact string.
# The actual string is: "border-border z-[60] font-sans font-light transition-all duration-300 ease-in-out fixed md:relative shrink-0 ${isCollapsed ? 'w-[68px] overflow-hidden' : 'w-[250px] overflow-hidden'} ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}"

import re
pattern = r"\$\{isCollapsed \? 'w-\[68px\] overflow-hidden' : 'w-\[250px\] overflow-hidden'\} \$\{isMobileOpen \? 'translate-x-0' : '-translate-x-full md:translate-x-0'\}"
replacement = "w-[250px] overflow-hidden ${isCollapsed ? 'md:w-[68px]' : 'md:w-[250px]'} ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}"

content = re.sub(pattern, replacement, content)

# One more thing: The header `isCollapsed` usage hides text or icons.
# For example, `opacity-0` when `isCollapsed`. If we're on mobile, `isCollapsed` might still be true if the user clicked collapse before resizing, or if default state is true.
# If `isCollapsed` is true, the user sees an expanded sidebar (because we just forced it to 250px width on mobile), BUT the contents inside might think it's collapsed (e.g. text opacity 0).
# We should probably force the inner components to behave as expanded on mobile, or better yet, make `isCollapsed` only apply on `md:`.
# We can do this by using responsive tailwind classes. For example, instead of `${isCollapsed ? 'opacity-0' : 'opacity-100'}`, we do `md:${isCollapsed ? 'opacity-0' : 'opacity-100'} opacity-100`.
# Or simpler: in `Sidebar.tsx`, add an effect or just conditionally handle it:
# `const effectivelyCollapsed = isCollapsed && !isMobileOpen;` -- wait, `isMobileOpen` is true when we are on mobile AND the sidebar is open.
# On desktop, `isMobileOpen` is generally false (or undefined).
# Let's just fix the width first.

with open(filepath, 'w') as f:
    f.write(content)
