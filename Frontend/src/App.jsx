import React, { useState, useEffect, useRef } from 'react';
import "prismjs/themes/prism-tomorrow.css";
import Editor from "react-simple-code-editor";
import prism from "prismjs";
import Markdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import axios from 'axios';
import './App.css';

// Helper function to recursively extract text from React nodes
const extractTextFromNode = (node) => {
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(extractTextFromNode).join('');
  if (node && node.props && node.props.children)
    return extractTextFromNode(node.props.children);
  return '';
};

// CopyButton Component
const CopyButton = ({ code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button className="copy-button" onClick={handleCopy}>
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
};

// Line Numbers Component for the Editor
const LineNumbers = ({ code, lineHeight = 24 }) => {
  if (!code) return null;
  
  const lines = code.split('\n');
  
  return (
    <div className="editor-line-numbers">
      {lines.map((_, i) => (
        <div key={i} className="editor-line-number">
          {i + 1}
        </div>
      ))}
    </div>
  );
};

function App() {
  const [showEditor, setShowEditor] = useState(false);
  const [code, setCode] = useState('');
  const [review, setReview] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [placeholder, setPlaceholder] = useState('');
  const editorRef = useRef(null);
  const codeContainerRef = useRef(null);

  // Typing effect for the placeholder
  useEffect(() => {
    if (!showEditor) return;

    const messages = ["Ask me anything...", "Paste Your Code Here..."];
    let messageIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    const type = () => {
      const currentMessage = messages[messageIndex];

      if (isDeleting) {
        setPlaceholder(currentMessage.substring(0, charIndex - 1));
        charIndex--;
      } else {
        setPlaceholder(currentMessage.substring(0, charIndex + 1));
        charIndex++;
      }

      if (!isDeleting && charIndex === currentMessage.length) {
        isDeleting = true;
        setTimeout(type, 1000);
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        messageIndex = (messageIndex + 1) % messages.length;
        setTimeout(type, 500);
      } else {
        setTimeout(type, isDeleting ? 50 : 100);
      }
    };

    type();
  }, [showEditor]);

  useEffect(() => {
    prism.highlightAll();
  }, [code, review]);

  // Handle line number synchronization with scrolling
  useEffect(() => {
    if (codeContainerRef.current) {
      const codeContainer = codeContainerRef.current;
      const lineNumbersEl = codeContainer.querySelector('.editor-line-numbers');
      
      // Ensure line numbers scroll along with the editor content
      if (lineNumbersEl) {
        const handleScroll = () => {
          lineNumbersEl.scrollTop = codeContainer.scrollTop;
        };
        
        codeContainer.addEventListener('scroll', handleScroll);
        return () => codeContainer.removeEventListener('scroll', handleScroll);
      }
    }
  }, [showEditor]);

  // Custom highlighting function with proper line breaks
  const highlightWithLineNumbers = (code) => {
    return prism.highlight(code, prism.languages.javascript, "javascript");
  };

  async function reviewCode() {
    setIsLoading(true);
    setReview('Reviewing...');

    try {
      const response = await axios.post('http://localhost:3000/ai/get-review', { code });
      setReview(response.data.review);
    } catch (error) {
      console.error("Error reviewing code:", error);
      setReview('Error occurred while reviewing the code.');
    } finally {
      setIsLoading(false);
    }
  }

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text/plain');
    const selectionStart = e.target.selectionStart;
    const selectionEnd = e.target.selectionEnd;

    const newCode =
      code.substring(0, selectionStart) +
      pastedText +
      code.substring(selectionEnd);

    setCode(newCode);

    const newCursorPosition = selectionStart + pastedText.length;
    setTimeout(() => {
      e.target.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
  };

  const clearCode = () => {
    setCode('');
  };

  // Custom components for Markdown with fixed line numbers
  const markdownComponents = {
    pre: ({ node, children, ...props }) => {
      const codeContent = extractTextFromNode(children);
      return (
        <pre {...props}>
          <CopyButton code={codeContent} />
          {children}
        </pre>
      );
    },
    code: ({ node, inline, className, children, ...props }) => {
      if (inline) {
        return <code className={className} {...props}>{children}</code>;
      }
      
      // For code blocks, add line numbers using data attributes
      const codeLines = Array.isArray(children) ? children.join('').split('\n') : children.toString().split('\n');
      
      return (
        <code className={className} {...props}>
          {codeLines.map((line, i) => (
            <span key={i} className="line" data-line-number={i + 1}>
              {line}
              {i < codeLines.length - 1 && '\n'}
            </span>
          ))}
        </code>
      );
    }
  };

  return (
    <>
      {!showEditor ? (
        <div className="welcome-page">
          <h1>Welcome to Your Personal Code Assistant</h1>
          <button className="btn" onClick={() => setShowEditor(true)}>
            Get Started
          </button>
        </div>
      ) : (
        <main>
          <div className="left">
            <div className="btn-container">
              <button className="btn clear-btn" onClick={clearCode}>
                Clear
              </button>
            </div>
            <div className="code" ref={codeContainerRef}>
              <div className="editor-container">
                <LineNumbers code={code} />
                <Editor
                  ref={editorRef}
                  value={code}
                  onValueChange={(newCode) => setCode(newCode)}
                  highlight={highlightWithLineNumbers}
                  padding={10}
                  style={{
                    fontFamily: '"Fira code", "Fira Mono", monospace',
                    fontSize: 16,
                    color: '#f8f8f2',
                  }}
                  onPaste={handlePaste}
                  placeholder={placeholder}
                  textareaClassName="editor-textarea"
                  preClassName="editor-preview"
                  className="react-simple-code-editor"
                />
              </div>
            </div>
            <button
              className={`btn review-btn ${isLoading ? 'loading' : ''}`}
              onClick={!isLoading ? reviewCode : undefined}
            >
              Review
            </button>
          </div>
          <div className="right">
            {isLoading ? (
              <div className="reviewing-box">
                <div className="loader"></div>
                <p>Reviewing...</p>
              </div>
            ) : (
              <Markdown
                rehypePlugins={[rehypeHighlight]}
                components={markdownComponents}
              >
                {review}
              </Markdown>
            )}
          </div>
        </main>
      )}
    </>
  );
}

export default App;