filepath = 'src/components/Sidebar.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# Restore imports
content = content.replace("import { MagnifyingGlassIcon, ChatBubbleIcon, ImageIcon as RadixImageIcon } from '@radix-ui/react-icons';\n", "")

# Restore icon usages
content = content.replace('<MagnifyingGlassIcon className="w-[18px] h-[18px]" />', '<Search size={18} strokeWidth={2} />')
content = content.replace('<ChatBubbleIcon className="w-[18px] h-[18px]" />', '<MessageCircle size={18} strokeWidth={2} />')
content = content.replace('<RadixImageIcon className="w-[18px] h-[18px]" />', '<ImageIcon size={18} strokeWidth={2} />')

# Restore shape
content = content.replace('w-[calc(100%-16px)] mx-2 rounded-lg', 'w-[calc(100%-16px)] mx-2 rounded-full')
content = content.replace('w-10 h-10 rounded-lg', 'w-10 h-10 rounded-full')
content = content.replace('rounded-lg transition-colors duration-200', 'rounded-full transition-colors duration-200')

with open(filepath, 'w') as f:
    f.write(content)
