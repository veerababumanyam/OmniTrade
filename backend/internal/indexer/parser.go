package indexer

import (
	"fmt"
	"os"
	"strings"
)

// CodeChunk represents a semantic block of code or documentation
type CodeChunk struct {
	FilePath  string
	Content   string
	Type      string // "chunk" or "file"
	Category  string // "codebase", "education", "project"
	Metadata  map[string]interface{}
	StartLine int
	EndLine   int
}

// Parser handles extracting semantic chunks from source code
type Parser struct {
	minChunkSize int
	maxChunkSize int
}

func NewParser() *Parser {
	return &Parser{
		minChunkSize: 100,
		maxChunkSize: 1000,
	}
}

// Parse extracts text chunks from a file
func (p *Parser) Parse(filePath string) ([]CodeChunk, error) {
	contentBytes, err := os.ReadFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to read file %s: %w", filePath, err)
	}

	content := string(contentBytes)
	
	// Quick size check
	if len(content) < p.minChunkSize {
		return []CodeChunk{{
			FilePath:  filePath,
			Content:   content,
			Type:      "file",
			StartLine: 1,
			EndLine:   strings.Count(content, "\n") + 1,
		}}, nil
	}

	return p.chunkByLines(filePath, content), nil
}

// chunkByLines uses a sliding window approach to chunk files
func (p *Parser) chunkByLines(filePath, content string) []CodeChunk {
	lines := strings.Split(content, "\n")
	var chunks []CodeChunk
	
	var currentChunk strings.Builder
	startLine := 1
	
	for i, line := range lines {
		// If a single line is absurdly large (e.g. minified JS or base64), truncate it
		if len(line) > p.maxChunkSize {
			line = line[:p.maxChunkSize]
		}

		currentChunk.WriteString(line)
		currentChunk.WriteString("\n")
		
		// If adding this line pushes us over the max chunk size, flush
		if currentChunk.Len() >= p.maxChunkSize || i == len(lines)-1 {
			if currentChunk.Len() >= p.minChunkSize || i == len(lines)-1 {
				chunkStr := strings.TrimSpace(currentChunk.String())
				
				// Final safety boundary
				if len(chunkStr) > p.maxChunkSize {
					chunkStr = chunkStr[:p.maxChunkSize]
				}

				if len(chunkStr) > 0 {
					chunks = append(chunks, CodeChunk{
						FilePath:  filePath,
						Content:   chunkStr,
						Type:      "chunk",
						Category:  "",
						StartLine: startLine,
						EndLine:   i + 1,
					})
				}
				currentChunk.Reset()
				startLine = i + 2
			}
		}
	}
	
	return chunks
}
