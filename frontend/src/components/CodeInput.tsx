"use client";

import { useState } from "react";

interface CodeInputProps {
  onSubmit: (code: string, language: string) => void;
  isScanning: boolean;
}

export default function CodeInput({ onSubmit, isScanning }: CodeInputProps) {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");

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
  };

  return (
    <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-[#e4e4e7]">Paste Your Code</h2>
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
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Paste your code here for security analysis..."
        className="w-full h-64 bg-[#0a0a0f] border border-[#2a2a3e] rounded-lg p-4 text-sm font-mono text-[#e4e4e7] placeholder-[#4a4a5e] focus:outline-none focus:border-[#00ff88] resize-none"
        spellCheck={false}
      />
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
