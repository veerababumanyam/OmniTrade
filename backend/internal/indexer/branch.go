package indexer

import (
	"bytes"
	"context"
	"log"
	"os/exec"
	"strings"
	"time"
)

// BranchWatcher periodcally checks the current git branch
type BranchWatcher struct {
	workspaceDir string
	currentBranch string
	engine       *Engine
}

func NewBranchWatcher(engine *Engine, workspaceDir string) *BranchWatcher {
	return &BranchWatcher{
		workspaceDir: workspaceDir,
		engine:       engine,
	}
}

func (w *BranchWatcher) Start() {
	// Wait a moment for initial indexing to begin
	time.Sleep(2 * time.Second)
	
	w.currentBranch = w.getBranch()
	if w.currentBranch != "" {
		log.Printf("Git Branch Watcher started on branch: %s", w.currentBranch)
	}

	go func() {
		ticker := time.NewTicker(5 * time.Second)
		defer ticker.Stop()

		for range ticker.C {
			branch := w.getBranch()
			if branch != "" && branch != w.currentBranch {
				log.Printf("Git branch changed from '%s' to '%s'. Triggering workspace re-index.", w.currentBranch, branch)
				w.currentBranch = branch
				// A branch switch means the filesystem changed out from under us en-masse.
				// The fsnotify watcher might catch it, but doing a manual trigger ensures consistency.
				go func() {
					// We wait briefly to let git finish writing all filesystem changes before indexing
					time.Sleep(2 * time.Second)
					
					// Re-index all will use the cache to skip unchanged files
					if err := w.engine.IndexAll(); err != nil {
						log.Printf("Error re-indexing after branch switch: %v", err)
					}
				}()
			}
		}
	}()
}

func (w *BranchWatcher) getBranch() string {
	cmd := exec.CommandContext(context.Background(), "git", "rev-parse", "--abbrev-ref", "HEAD")
	cmd.Dir = w.workspaceDir
	
	var out bytes.Buffer
	cmd.Stdout = &out
	
	if err := cmd.Run(); err != nil {
		return ""
	}
	
	return strings.TrimSpace(out.String())
}
