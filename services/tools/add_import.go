package main

import (
	"bytes"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

func main() {
	target := filepath.Join("internal", "graph", "generated.go")
	importLine := "\t\"spark/internal/graph/directives\""

	data, err := os.ReadFile(target)
	if err != nil {
		fmt.Println("error reading file:", err)
		os.Exit(1)
	}

	content := string(data)

	if strings.Contains(content, "spark/internal/graph/directives") {
		fmt.Println("import already present")
		return
	}

	insertPoint := "import ("
	idx := strings.Index(content, insertPoint)
	if idx == -1 {
		fmt.Println("import block not found in generated.go")
		os.Exit(1)
	}

	var buf bytes.Buffer
	buf.WriteString(content[:idx+len(insertPoint)])
	buf.WriteString("\n" + importLine)
	buf.WriteString(content[idx+len(insertPoint):])

	err = os.WriteFile(target, buf.Bytes(), 0644)
	if err != nil {
		fmt.Println("error writing file:", err)
		os.Exit(1)
	}

	fmt.Println("import added to generated.go")
}
