with open("src/contexts/AuthContext.tsx", "r") as f:
    text = f.read()

text = text.replace("  systemPrompt?: string;\n  createdAt: any;\n  updatedAt?: any;\n  systemPrompt?: string;", "  systemPrompt?: string;\n  createdAt: any;\n  updatedAt?: any;")

with open("src/contexts/AuthContext.tsx", "w") as f:
    f.write(text)
