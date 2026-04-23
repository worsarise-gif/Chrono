filepath = 'src/components/Sidebar.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# Replace the responsive sidebar wrapper classes
# from:
# `${isCollapsed ? 'w-[68px] overflow-hidden' : 'w-[250px] overflow-hidden'} ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`
#
# to:
# `w-[250px] md:w-auto overflow-hidden ${isCollapsed ? 'md:w-[68px]' : 'md:w-[250px]'} ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`
# Wait, actually it's easier to just use Tailwind breakpoint classes correctly:
# On mobile (default), width is 250px ALWAYS.
# On md (desktop), width is either 68px (if collapsed) or 250px (if expanded).
# So: `w-[250px] md:w-${isCollapsed ? '[68px]' : '[250px]'} overflow-hidden ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`

old_classes = "`${isCollapsed ? 'w-[68px] overflow-hidden' : 'w-[250px] overflow-hidden'} ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`"
new_classes = "`w-[250px] overflow-hidden ${isCollapsed ? 'md:w-[68px]' : 'md:w-[250px]'} ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`"

content = content.replace(old_classes, new_classes)

with open(filepath, 'w') as f:
    f.write(content)
