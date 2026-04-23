import re

filepath = 'src/components/Sidebar.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# Instead of updating every single inner class, let's derive a variable `isDesktopCollapsed`
# that is only true on desktop. However, we don't have a reliable `isMobile` flag in render without a hook.
# Let's see how `isCollapsed` is used:
# `isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'`
# To make this responsive:
# `opacity-100 w-auto md:${isCollapsed ? 'opacity-0 md:w-0' : 'opacity-100 md:w-auto'}`
# Tailwind doesn't allow string interpolation inside the variant if we don't include the full class.
# So we can change `isCollapsed` usage to:
# `${isCollapsed ? 'md:opacity-0 md:w-0 md:overflow-hidden' : 'md:opacity-100 md:w-auto'}`
# AND add base classes `opacity-100 w-auto` so on mobile it's always visible.

# Let's replace the `opacity-0 w-0 overflow-hidden` logic for the NavItem text.
content = content.replace(
    "${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}",
    "opacity-100 w-auto ${isCollapsed ? 'md:opacity-0 md:w-0 md:overflow-hidden' : 'md:opacity-100 md:w-auto'}"
)

# For the collapse button header:
# `${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`
content = content.replace(
    "${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}",
    "opacity-100 ${isCollapsed ? 'md:opacity-0 md:pointer-events-none' : 'md:opacity-100'}"
)

# For the bottom tooltip expand button:
# `hidden md:flex group ${isCollapsed ? 'opacity-100' : 'opacity-0 pointer-events-none'}`
# That one is already `hidden md:flex`, so it only shows on desktop. It's fine.

# For Chat History title:
# `${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}` (already covered by above replacement if string matches exactly)

# For User info text:
# `${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}` (already covered)

with open(filepath, 'w') as f:
    f.write(content)
