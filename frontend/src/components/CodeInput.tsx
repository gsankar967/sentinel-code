"use client";

import { useState } from "react";

interface CodeInputProps {
  onSubmit: (code: string, language: string) => void;
  isScanning: boolean;
}

export default function CodeInput({ onSubmit, isScanning }: CodeInputProps) {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [repoUrl, setRepoUrl] = useState("");
  const [inputMode, setInputMode] = useState<"paste" | "repo">("paste");
  const [fetchingRepo, setFetchingRepo] = useState(false);

  const samples: Record<string, string> = {
    python: `import sqlite3
from flask import Flask, request

app = Flask(__name__)

@app.route('/login', methods=['POST'])
def login():
    username = request.form['username']
    password = request.form['password']

    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()

    # SQL Injection vulnerability
    query = f"SELECT * FROM users WHERE username='{username}' AND password='{password}'"
    cursor.execute(query)

    user = cursor.fetchone()
    if user:
        return f"Welcome {username}!"
    return "Invalid credentials", 401

@app.route('/profile')
def profile():
    user_id = request.args.get('id')
    # XSS vulnerability
    return f"<h1>Profile for user {user_id}</h1>"
`,
    javascript: `const express = require('express');
const mysql = require('mysql');
const app = express();

app.get('/user', (req, res) => {
  const userId = req.query.id;
  // SQL Injection vulnerability
  const query = "SELECT * FROM users WHERE id = " + userId;
  db.query(query, (err, results) => {
    res.json(results);
  });
});

app.get('/search', (req, res) => {
  const term = req.query.q;
  // XSS vulnerability
  res.send('<h1>Results for: ' + term + '</h1>');
});

app.get('/file', (req, res) => {
  const filename = req.query.name;
  // Path traversal vulnerability
  res.sendFile('/uploads/' + filename);
});

app.post('/exec', (req, res) => {
  const cmd = req.body.command;
  // Command injection vulnerability
  require('child_process').exec(cmd, (err, stdout) => {
    res.send(stdout);
  });
});
`,
    typescript: `import express, { Request, Response } from 'express';
import { createConnection } from 'typeorm';

const app = express();

app.post('/api/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  // SQL Injection via raw query
  const user = await connection.query(
    \`SELECT * FROM users WHERE email = '\${email}' AND password = '\${password}'\`
  );
  // Sensitive data exposure
  res.json({ user: user[0], token: process.env.JWT_SECRET });
});

app.get('/api/redirect', (req: Request, res: Response) => {
  // Open redirect vulnerability
  const url = req.query.url as string;
  res.redirect(url);
});

app.post('/api/upload', (req: Request, res: Response) => {
  const { content, filename } = req.body;
  // Path traversal + no validation
  require('fs').writeFileSync('/uploads/' + filename, content);
  res.json({ status: 'ok' });
});
`,
    java: `import java.sql.*;
import javax.servlet.http.*;

public class LoginServlet extends HttpServlet {
    protected void doPost(HttpServletRequest request, HttpServletResponse response) {
        String username = request.getParameter("username");
        String password = request.getParameter("password");

        // SQL Injection vulnerability
        String query = "SELECT * FROM users WHERE username='" + username
                     + "' AND password='" + password + "'";
        Statement stmt = connection.createStatement();
        ResultSet rs = stmt.executeQuery(query);

        // XSS vulnerability
        response.getWriter().println("<h1>Welcome " + username + "</h1>");

        // Insecure deserialization
        ObjectInputStream ois = new ObjectInputStream(request.getInputStream());
        Object obj = ois.readObject();
    }
}
`,
    go: `package main

import (
	"database/sql"
	"fmt"
	"net/http"
	"os/exec"
	"html/template"
	"io/ioutil"
)

func loginHandler(w http.ResponseWriter, r *http.Request) {
	username := r.FormValue("username")
	password := r.FormValue("password")

	// SQL Injection vulnerability
	query := fmt.Sprintf("SELECT * FROM users WHERE username='%s' AND password='%s'", username, password)
	db.Query(query)

	// XSS vulnerability
	fmt.Fprintf(w, "<h1>Welcome %s</h1>", username)
}

func cmdHandler(w http.ResponseWriter, r *http.Request) {
	cmd := r.URL.Query().Get("cmd")
	// Command injection vulnerability
	out, _ := exec.Command("sh", "-c", cmd).Output()
	w.Write(out)
}

func fileHandler(w http.ResponseWriter, r *http.Request) {
	filename := r.URL.Query().Get("file")
	// Path traversal vulnerability
	data, _ := ioutil.ReadFile("/data/" + filename)
	w.Write(data)
}

func main() {
	http.HandleFunc("/login", loginHandler)
	http.HandleFunc("/cmd", cmdHandler)
	http.HandleFunc("/file", fileHandler)
	http.ListenAndServe(":8080", nil)
}
`,
  };

  const [fetchError, setFetchError] = useState("");

  const fetchRepo = async () => {
    if (!repoUrl.trim()) return;
    setFetchingRepo(true);
    setFetchError("");
    try {
      const resp = await fetch(`/api/repo?url=${encodeURIComponent(repoUrl)}`);
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ detail: "Failed to fetch" }));
        setFetchError(err.detail || "Failed to fetch repo");
        return;
      }
      const data = await resp.json();
      if (data.code) {
        setCode(data.code);
        if (data.language) setLanguage(data.language);
        setInputMode("paste");
      } else {
        setFetchError("No source code found in repo");
      }
    } catch {
      setFetchError("Network error — could not reach backend");
    } finally {
      setFetchingRepo(false);
    }
  };

  return (
    <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setInputMode("paste")}
            className={`text-sm px-3 py-1 rounded-lg transition-colors ${inputMode === "paste" ? "bg-[#00ff88] text-[#0a0a0f] font-semibold" : "text-[#a1a1aa] hover:text-[#e4e4e7]"}`}
          >
            Paste Code
          </button>
          <button
            onClick={() => setInputMode("repo")}
            className={`text-sm px-3 py-1 rounded-lg transition-colors ${inputMode === "repo" ? "bg-[#00ff88] text-[#0a0a0f] font-semibold" : "text-[#a1a1aa] hover:text-[#e4e4e7]"}`}
          >
            GitHub URL
          </button>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-[#12121a] border border-[#2a2a3e] text-[#e4e4e7] text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#00ff88]"
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="java">Java</option>
            <option value="go">Go</option>
            <option value="auto">Auto-detect</option>
          </select>
          <button
            onClick={() => setCode(samples[language] || samples.python)}
            className="text-xs text-[#00aaff] hover:text-[#00ff88] transition-colors"
          >
            Load sample
          </button>
        </div>
      </div>

      {inputMode === "repo" ? (
        <div>
          <div className="flex gap-2">
            <input
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/user/repo or https://github.com/user/repo/blob/main/file.py"
              className="flex-1 bg-[#0a0a0f] border border-[#2a2a3e] rounded-lg px-4 py-3 text-sm font-mono text-[#e4e4e7] placeholder-[#4a4a5e] focus:outline-none focus:border-[#00ff88]"
            />
            <button
              onClick={fetchRepo}
              disabled={!repoUrl.trim() || fetchingRepo}
              className="px-4 py-2 bg-[#00aaff] text-white font-semibold rounded-lg hover:bg-[#0088dd] disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm"
            >
              {fetchingRepo ? "Fetching..." : "Fetch"}
            </button>
          </div>
          {fetchError && (
            <p className="text-xs text-red-400 mt-2">{fetchError}</p>
          )}
        </div>
      ) : (
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Paste your code here for security analysis..."
          className="w-full h-64 bg-[#0a0a0f] border border-[#2a2a3e] rounded-lg p-4 text-sm font-mono text-[#e4e4e7] placeholder-[#4a4a5e] focus:outline-none focus:border-[#00ff88] resize-none"
          spellCheck={false}
        />
      )}

      <div className="flex items-center justify-between mt-3">
        <p className="text-xs text-[#a1a1aa]">
          {code.split("\n").length} lines | {language}
        </p>
        <button
          onClick={() => onSubmit(code, language)}
          disabled={!code.trim() || isScanning}
          className="px-6 py-2 bg-[#00ff88] text-[#0a0a0f] font-semibold rounded-lg hover:bg-[#00dd77] disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm"
        >
          {isScanning ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-[#0a0a0f] border-t-transparent rounded-full animate-spin" />
              Scanning...
            </span>
          ) : (
            "Scan for Vulnerabilities"
          )}
        </button>
      </div>
    </div>
  );
}
