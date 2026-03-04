package indexer

import (
	"bufio"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
)

// IndexStatus represents the current state of the indexer
type IndexStatus string

const (
	StatusStandby  IndexStatus = "Standby"
	StatusIndexing IndexStatus = "Indexing"
	StatusIndexed  IndexStatus = "Indexed"
	StatusError    IndexStatus = "Error"
)

// Filterer handles determining which files should be indexed
type Filterer struct {
	workspaceDir string
	ignoreRules  []string
}

func NewFilterer(workspaceDir string) *Filterer {
	f := &Filterer{
		workspaceDir: workspaceDir,
		ignoreRules:  []string{".git", "node_modules", "vendor"}, // Default hard ignores
	}
	f.loadIgnores()
	return f
}

func (f *Filterer) loadIgnores() {
	filesToRead := []string{".gitignore", ".ragignore", ".codebaseignore"}
	for _, file := range filesToRead {
		path := filepath.Join(f.workspaceDir, file)
		if content, err := os.ReadFile(path); err == nil {
			scanner := bufio.NewScanner(strings.NewReader(string(content)))
			for scanner.Scan() {
				line := strings.TrimSpace(scanner.Text())
				if len(line) > 0 && !strings.HasPrefix(line, "#") {
					f.ignoreRules = append(f.ignoreRules, line)
				}
			}
		}
	}
}

// ShouldIndex checks if a file at path relative to workspace should be indexed.
func (f *Filterer) ShouldIndex(path string, info fs.FileInfo) bool {
	if info.IsDir() {
		// Specific directory checks
		base := info.Name()
		if base == ".git" || base == "node_modules" || base == "vendor" {
			return false
		}
		return true // Will filter children individually
	}

	// 1MB size limit
	if info.Size() > 1024*1024 {
		return false
	}

	// Simple binary heuristic (skip known binary extensions)
	ext := strings.ToLower(filepath.Ext(path))
	binaryExts := map[string]bool{
		".png": true, ".jpg": true, ".jpeg": true, ".gif": true,
		".exe": true, ".dll": true, ".so": true, ".bin": true,
		".zip": true, ".tar": true, ".gz": true, ".pdf": true,
		".mp4": true, ".mp3": true, ".wav": true,
		".db": true, ".sqlite": true, ".sqlite3": true, // Database files
	}
	if binaryExts[ext] {
		return false
	}

	// Check against ignore rules
	relPath, err := filepath.Rel(f.workspaceDir, path)
	if err != nil {
		relPath = path
	}
	
	// Convert Windows path separator to forward slash for standard matching
	relPath = filepath.ToSlash(relPath)

	for _, rule := range f.ignoreRules {
		// Very basic pattern matching for gitignore
		rule = strings.TrimPrefix(rule, "/")
		if strings.HasPrefix(relPath, rule) || strings.Contains(relPath, "/"+rule) || relPath == rule {
			return false
		}
		if matched, _ := filepath.Match(rule, filepath.Base(relPath)); matched {
			return false
		}
	}

	return true
}

func (f *Filterer) DiscoverFiles() ([]string, error) {
	var files []string
	err := filepath.WalkDir(f.workspaceDir, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		info, err := d.Info()
		if err != nil {
			return nil
		}
		
		if !f.ShouldIndex(path, info) {
			if d.IsDir() {
				return fs.SkipDir
			}
			return nil
		}
		
		if !d.IsDir() {
			files = append(files, path)
		}
		return nil
	})
	return files, err
}
