with open('src/components/DocGenerator.tsx', 'r') as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if 'CBC Schemes of Work &bull; 13-Week Official Syllabus Planning' in line:
        start_idx = i - 3 # include the div above it
        break

for i in range(start_idx, len(lines)):
    if 'renderKnowledgeBase()' in line:
        end_idx = i - 1 # just before renderKnowledgeBase
        break

print('start_idx:', start_idx, 'line:', lines[start_idx][:60])
print('end_idx:', end_idx, 'line:', lines[end_idx][:60])
