import re

with open('src/components/ChatArea.tsx', 'r') as f:
    content = f.read()

done_occurrences = []
for i, line in enumerate(content.split('\n')):
    if 'event.type' in line or 'type ===' in line or "chunk.type" in line:
        done_occurrences.append(f"{i+1}: {line.strip()}")
print('\n'.join(done_occurrences))
