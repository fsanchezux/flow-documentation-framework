var FlowDocsModule = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __publicField = (obj, key, value) => {
    __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
    return value;
  };
  var __accessCheck = (obj, member, msg) => {
    if (!member.has(obj))
      throw TypeError("Cannot " + msg);
  };
  var __privateAdd = (obj, member, value) => {
    if (member.has(obj))
      throw TypeError("Cannot add the same private member more than once");
    member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
  };
  var __privateMethod = (obj, member, method) => {
    __accessCheck(obj, member, "access private method");
    return method;
  };

  // node_modules/marked/lib/marked.esm.js
  function _getDefaults() {
    return {
      async: false,
      breaks: false,
      extensions: null,
      gfm: true,
      hooks: null,
      pedantic: false,
      renderer: null,
      silent: false,
      tokenizer: null,
      walkTokens: null
    };
  }
  function changeDefaults(newDefaults) {
    _defaults = newDefaults;
  }
  function escape(html, encode) {
    if (encode) {
      if (escapeTest.test(html)) {
        return html.replace(escapeReplace, getEscapeReplacement);
      }
    } else {
      if (escapeTestNoEncode.test(html)) {
        return html.replace(escapeReplaceNoEncode, getEscapeReplacement);
      }
    }
    return html;
  }
  function unescape(html) {
    return html.replace(unescapeTest, (_, n) => {
      n = n.toLowerCase();
      if (n === "colon")
        return ":";
      if (n.charAt(0) === "#") {
        return n.charAt(1) === "x" ? String.fromCharCode(parseInt(n.substring(2), 16)) : String.fromCharCode(+n.substring(1));
      }
      return "";
    });
  }
  function edit(regex, opt) {
    regex = typeof regex === "string" ? regex : regex.source;
    opt = opt || "";
    const obj = {
      replace: (name, val) => {
        val = typeof val === "object" && "source" in val ? val.source : val;
        val = val.replace(caret, "$1");
        regex = regex.replace(name, val);
        return obj;
      },
      getRegex: () => {
        return new RegExp(regex, opt);
      }
    };
    return obj;
  }
  function cleanUrl(href) {
    try {
      href = encodeURI(href).replace(/%25/g, "%");
    } catch (e) {
      return null;
    }
    return href;
  }
  function splitCells(tableRow, count) {
    const row = tableRow.replace(/\|/g, (match, offset, str) => {
      let escaped = false;
      let curr = offset;
      while (--curr >= 0 && str[curr] === "\\")
        escaped = !escaped;
      if (escaped) {
        return "|";
      } else {
        return " |";
      }
    }), cells = row.split(/ \|/);
    let i = 0;
    if (!cells[0].trim()) {
      cells.shift();
    }
    if (cells.length > 0 && !cells[cells.length - 1].trim()) {
      cells.pop();
    }
    if (count) {
      if (cells.length > count) {
        cells.splice(count);
      } else {
        while (cells.length < count)
          cells.push("");
      }
    }
    for (; i < cells.length; i++) {
      cells[i] = cells[i].trim().replace(/\\\|/g, "|");
    }
    return cells;
  }
  function rtrim(str, c, invert) {
    const l = str.length;
    if (l === 0) {
      return "";
    }
    let suffLen = 0;
    while (suffLen < l) {
      const currChar = str.charAt(l - suffLen - 1);
      if (currChar === c && !invert) {
        suffLen++;
      } else if (currChar !== c && invert) {
        suffLen++;
      } else {
        break;
      }
    }
    return str.slice(0, l - suffLen);
  }
  function findClosingBracket(str, b) {
    if (str.indexOf(b[1]) === -1) {
      return -1;
    }
    let level = 0;
    for (let i = 0; i < str.length; i++) {
      if (str[i] === "\\") {
        i++;
      } else if (str[i] === b[0]) {
        level++;
      } else if (str[i] === b[1]) {
        level--;
        if (level < 0) {
          return i;
        }
      }
    }
    return -1;
  }
  function outputLink(cap, link, raw, lexer2) {
    const href = link.href;
    const title = link.title ? escape(link.title) : null;
    const text = cap[1].replace(/\\([\[\]])/g, "$1");
    if (cap[0].charAt(0) !== "!") {
      lexer2.state.inLink = true;
      const token = {
        type: "link",
        raw,
        href,
        title,
        text,
        tokens: lexer2.inlineTokens(text)
      };
      lexer2.state.inLink = false;
      return token;
    }
    return {
      type: "image",
      raw,
      href,
      title,
      text: escape(text)
    };
  }
  function indentCodeCompensation(raw, text) {
    const matchIndentToCode = raw.match(/^(\s+)(?:```)/);
    if (matchIndentToCode === null) {
      return text;
    }
    const indentToCode = matchIndentToCode[1];
    return text.split("\n").map((node) => {
      const matchIndentInNode = node.match(/^\s+/);
      if (matchIndentInNode === null) {
        return node;
      }
      const [indentInNode] = matchIndentInNode;
      if (indentInNode.length >= indentToCode.length) {
        return node.slice(indentToCode.length);
      }
      return node;
    }).join("\n");
  }
  function marked(src, opt) {
    return markedInstance.parse(src, opt);
  }
  var _defaults, escapeTest, escapeReplace, escapeTestNoEncode, escapeReplaceNoEncode, escapeReplacements, getEscapeReplacement, unescapeTest, caret, noopTest, _Tokenizer, block, inline, _Lexer, _Renderer, _TextRenderer, _Parser, _Hooks, _parseMarkdown, parseMarkdown_fn, _onError, onError_fn, Marked, markedInstance, options, setOptions, use, walkTokens, parseInline, parser, lexer;
  var init_marked_esm = __esm({
    "node_modules/marked/lib/marked.esm.js"() {
      _defaults = _getDefaults();
      escapeTest = /[&<>"']/;
      escapeReplace = new RegExp(escapeTest.source, "g");
      escapeTestNoEncode = /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/;
      escapeReplaceNoEncode = new RegExp(escapeTestNoEncode.source, "g");
      escapeReplacements = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      };
      getEscapeReplacement = (ch) => escapeReplacements[ch];
      unescapeTest = /&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig;
      caret = /(^|[^\[])\^/g;
      noopTest = { exec: () => null };
      _Tokenizer = class {
        constructor(options2) {
          __publicField(this, "options");
          // TODO: Fix this rules type
          __publicField(this, "rules");
          __publicField(this, "lexer");
          this.options = options2 || _defaults;
        }
        space(src) {
          const cap = this.rules.block.newline.exec(src);
          if (cap && cap[0].length > 0) {
            return {
              type: "space",
              raw: cap[0]
            };
          }
        }
        code(src) {
          const cap = this.rules.block.code.exec(src);
          if (cap) {
            const text = cap[0].replace(/^ {1,4}/gm, "");
            return {
              type: "code",
              raw: cap[0],
              codeBlockStyle: "indented",
              text: !this.options.pedantic ? rtrim(text, "\n") : text
            };
          }
        }
        fences(src) {
          const cap = this.rules.block.fences.exec(src);
          if (cap) {
            const raw = cap[0];
            const text = indentCodeCompensation(raw, cap[3] || "");
            return {
              type: "code",
              raw,
              lang: cap[2] ? cap[2].trim().replace(this.rules.inline._escapes, "$1") : cap[2],
              text
            };
          }
        }
        heading(src) {
          const cap = this.rules.block.heading.exec(src);
          if (cap) {
            let text = cap[2].trim();
            if (/#$/.test(text)) {
              const trimmed = rtrim(text, "#");
              if (this.options.pedantic) {
                text = trimmed.trim();
              } else if (!trimmed || / $/.test(trimmed)) {
                text = trimmed.trim();
              }
            }
            return {
              type: "heading",
              raw: cap[0],
              depth: cap[1].length,
              text,
              tokens: this.lexer.inline(text)
            };
          }
        }
        hr(src) {
          const cap = this.rules.block.hr.exec(src);
          if (cap) {
            return {
              type: "hr",
              raw: cap[0]
            };
          }
        }
        blockquote(src) {
          const cap = this.rules.block.blockquote.exec(src);
          if (cap) {
            const text = rtrim(cap[0].replace(/^ *>[ \t]?/gm, ""), "\n");
            const top = this.lexer.state.top;
            this.lexer.state.top = true;
            const tokens = this.lexer.blockTokens(text);
            this.lexer.state.top = top;
            return {
              type: "blockquote",
              raw: cap[0],
              tokens,
              text
            };
          }
        }
        list(src) {
          let cap = this.rules.block.list.exec(src);
          if (cap) {
            let bull = cap[1].trim();
            const isordered = bull.length > 1;
            const list = {
              type: "list",
              raw: "",
              ordered: isordered,
              start: isordered ? +bull.slice(0, -1) : "",
              loose: false,
              items: []
            };
            bull = isordered ? `\\d{1,9}\\${bull.slice(-1)}` : `\\${bull}`;
            if (this.options.pedantic) {
              bull = isordered ? bull : "[*+-]";
            }
            const itemRegex = new RegExp(`^( {0,3}${bull})((?:[	 ][^\\n]*)?(?:\\n|$))`);
            let raw = "";
            let itemContents = "";
            let endsWithBlankLine = false;
            while (src) {
              let endEarly = false;
              if (!(cap = itemRegex.exec(src))) {
                break;
              }
              if (this.rules.block.hr.test(src)) {
                break;
              }
              raw = cap[0];
              src = src.substring(raw.length);
              let line = cap[2].split("\n", 1)[0].replace(/^\t+/, (t) => " ".repeat(3 * t.length));
              let nextLine = src.split("\n", 1)[0];
              let indent = 0;
              if (this.options.pedantic) {
                indent = 2;
                itemContents = line.trimStart();
              } else {
                indent = cap[2].search(/[^ ]/);
                indent = indent > 4 ? 1 : indent;
                itemContents = line.slice(indent);
                indent += cap[1].length;
              }
              let blankLine = false;
              if (!line && /^ *$/.test(nextLine)) {
                raw += nextLine + "\n";
                src = src.substring(nextLine.length + 1);
                endEarly = true;
              }
              if (!endEarly) {
                const nextBulletRegex = new RegExp(`^ {0,${Math.min(3, indent - 1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`);
                const hrRegex = new RegExp(`^ {0,${Math.min(3, indent - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`);
                const fencesBeginRegex = new RegExp(`^ {0,${Math.min(3, indent - 1)}}(?:\`\`\`|~~~)`);
                const headingBeginRegex = new RegExp(`^ {0,${Math.min(3, indent - 1)}}#`);
                while (src) {
                  const rawLine = src.split("\n", 1)[0];
                  nextLine = rawLine;
                  if (this.options.pedantic) {
                    nextLine = nextLine.replace(/^ {1,4}(?=( {4})*[^ ])/g, "  ");
                  }
                  if (fencesBeginRegex.test(nextLine)) {
                    break;
                  }
                  if (headingBeginRegex.test(nextLine)) {
                    break;
                  }
                  if (nextBulletRegex.test(nextLine)) {
                    break;
                  }
                  if (hrRegex.test(src)) {
                    break;
                  }
                  if (nextLine.search(/[^ ]/) >= indent || !nextLine.trim()) {
                    itemContents += "\n" + nextLine.slice(indent);
                  } else {
                    if (blankLine) {
                      break;
                    }
                    if (line.search(/[^ ]/) >= 4) {
                      break;
                    }
                    if (fencesBeginRegex.test(line)) {
                      break;
                    }
                    if (headingBeginRegex.test(line)) {
                      break;
                    }
                    if (hrRegex.test(line)) {
                      break;
                    }
                    itemContents += "\n" + nextLine;
                  }
                  if (!blankLine && !nextLine.trim()) {
                    blankLine = true;
                  }
                  raw += rawLine + "\n";
                  src = src.substring(rawLine.length + 1);
                  line = nextLine.slice(indent);
                }
              }
              if (!list.loose) {
                if (endsWithBlankLine) {
                  list.loose = true;
                } else if (/\n *\n *$/.test(raw)) {
                  endsWithBlankLine = true;
                }
              }
              let istask = null;
              let ischecked;
              if (this.options.gfm) {
                istask = /^\[[ xX]\] /.exec(itemContents);
                if (istask) {
                  ischecked = istask[0] !== "[ ] ";
                  itemContents = itemContents.replace(/^\[[ xX]\] +/, "");
                }
              }
              list.items.push({
                type: "list_item",
                raw,
                task: !!istask,
                checked: ischecked,
                loose: false,
                text: itemContents,
                tokens: []
              });
              list.raw += raw;
            }
            list.items[list.items.length - 1].raw = raw.trimEnd();
            list.items[list.items.length - 1].text = itemContents.trimEnd();
            list.raw = list.raw.trimEnd();
            for (let i = 0; i < list.items.length; i++) {
              this.lexer.state.top = false;
              list.items[i].tokens = this.lexer.blockTokens(list.items[i].text, []);
              if (!list.loose) {
                const spacers = list.items[i].tokens.filter((t) => t.type === "space");
                const hasMultipleLineBreaks = spacers.length > 0 && spacers.some((t) => /\n.*\n/.test(t.raw));
                list.loose = hasMultipleLineBreaks;
              }
            }
            if (list.loose) {
              for (let i = 0; i < list.items.length; i++) {
                list.items[i].loose = true;
              }
            }
            return list;
          }
        }
        html(src) {
          const cap = this.rules.block.html.exec(src);
          if (cap) {
            const token = {
              type: "html",
              block: true,
              raw: cap[0],
              pre: cap[1] === "pre" || cap[1] === "script" || cap[1] === "style",
              text: cap[0]
            };
            return token;
          }
        }
        def(src) {
          const cap = this.rules.block.def.exec(src);
          if (cap) {
            const tag = cap[1].toLowerCase().replace(/\s+/g, " ");
            const href = cap[2] ? cap[2].replace(/^<(.*)>$/, "$1").replace(this.rules.inline._escapes, "$1") : "";
            const title = cap[3] ? cap[3].substring(1, cap[3].length - 1).replace(this.rules.inline._escapes, "$1") : cap[3];
            return {
              type: "def",
              tag,
              raw: cap[0],
              href,
              title
            };
          }
        }
        table(src) {
          const cap = this.rules.block.table.exec(src);
          if (cap) {
            if (!/[:|]/.test(cap[2])) {
              return;
            }
            const item = {
              type: "table",
              raw: cap[0],
              header: splitCells(cap[1]).map((c) => {
                return { text: c, tokens: [] };
              }),
              align: cap[2].replace(/^\||\| *$/g, "").split("|"),
              rows: cap[3] && cap[3].trim() ? cap[3].replace(/\n[ \t]*$/, "").split("\n") : []
            };
            if (item.header.length === item.align.length) {
              let l = item.align.length;
              let i, j, k, row;
              for (i = 0; i < l; i++) {
                const align = item.align[i];
                if (align) {
                  if (/^ *-+: *$/.test(align)) {
                    item.align[i] = "right";
                  } else if (/^ *:-+: *$/.test(align)) {
                    item.align[i] = "center";
                  } else if (/^ *:-+ *$/.test(align)) {
                    item.align[i] = "left";
                  } else {
                    item.align[i] = null;
                  }
                }
              }
              l = item.rows.length;
              for (i = 0; i < l; i++) {
                item.rows[i] = splitCells(item.rows[i], item.header.length).map((c) => {
                  return { text: c, tokens: [] };
                });
              }
              l = item.header.length;
              for (j = 0; j < l; j++) {
                item.header[j].tokens = this.lexer.inline(item.header[j].text);
              }
              l = item.rows.length;
              for (j = 0; j < l; j++) {
                row = item.rows[j];
                for (k = 0; k < row.length; k++) {
                  row[k].tokens = this.lexer.inline(row[k].text);
                }
              }
              return item;
            }
          }
        }
        lheading(src) {
          const cap = this.rules.block.lheading.exec(src);
          if (cap) {
            return {
              type: "heading",
              raw: cap[0],
              depth: cap[2].charAt(0) === "=" ? 1 : 2,
              text: cap[1],
              tokens: this.lexer.inline(cap[1])
            };
          }
        }
        paragraph(src) {
          const cap = this.rules.block.paragraph.exec(src);
          if (cap) {
            const text = cap[1].charAt(cap[1].length - 1) === "\n" ? cap[1].slice(0, -1) : cap[1];
            return {
              type: "paragraph",
              raw: cap[0],
              text,
              tokens: this.lexer.inline(text)
            };
          }
        }
        text(src) {
          const cap = this.rules.block.text.exec(src);
          if (cap) {
            return {
              type: "text",
              raw: cap[0],
              text: cap[0],
              tokens: this.lexer.inline(cap[0])
            };
          }
        }
        escape(src) {
          const cap = this.rules.inline.escape.exec(src);
          if (cap) {
            return {
              type: "escape",
              raw: cap[0],
              text: escape(cap[1])
            };
          }
        }
        tag(src) {
          const cap = this.rules.inline.tag.exec(src);
          if (cap) {
            if (!this.lexer.state.inLink && /^<a /i.test(cap[0])) {
              this.lexer.state.inLink = true;
            } else if (this.lexer.state.inLink && /^<\/a>/i.test(cap[0])) {
              this.lexer.state.inLink = false;
            }
            if (!this.lexer.state.inRawBlock && /^<(pre|code|kbd|script)(\s|>)/i.test(cap[0])) {
              this.lexer.state.inRawBlock = true;
            } else if (this.lexer.state.inRawBlock && /^<\/(pre|code|kbd|script)(\s|>)/i.test(cap[0])) {
              this.lexer.state.inRawBlock = false;
            }
            return {
              type: "html",
              raw: cap[0],
              inLink: this.lexer.state.inLink,
              inRawBlock: this.lexer.state.inRawBlock,
              block: false,
              text: cap[0]
            };
          }
        }
        link(src) {
          const cap = this.rules.inline.link.exec(src);
          if (cap) {
            const trimmedUrl = cap[2].trim();
            if (!this.options.pedantic && /^</.test(trimmedUrl)) {
              if (!/>$/.test(trimmedUrl)) {
                return;
              }
              const rtrimSlash = rtrim(trimmedUrl.slice(0, -1), "\\");
              if ((trimmedUrl.length - rtrimSlash.length) % 2 === 0) {
                return;
              }
            } else {
              const lastParenIndex = findClosingBracket(cap[2], "()");
              if (lastParenIndex > -1) {
                const start = cap[0].indexOf("!") === 0 ? 5 : 4;
                const linkLen = start + cap[1].length + lastParenIndex;
                cap[2] = cap[2].substring(0, lastParenIndex);
                cap[0] = cap[0].substring(0, linkLen).trim();
                cap[3] = "";
              }
            }
            let href = cap[2];
            let title = "";
            if (this.options.pedantic) {
              const link = /^([^'"]*[^\s])\s+(['"])(.*)\2/.exec(href);
              if (link) {
                href = link[1];
                title = link[3];
              }
            } else {
              title = cap[3] ? cap[3].slice(1, -1) : "";
            }
            href = href.trim();
            if (/^</.test(href)) {
              if (this.options.pedantic && !/>$/.test(trimmedUrl)) {
                href = href.slice(1);
              } else {
                href = href.slice(1, -1);
              }
            }
            return outputLink(cap, {
              href: href ? href.replace(this.rules.inline._escapes, "$1") : href,
              title: title ? title.replace(this.rules.inline._escapes, "$1") : title
            }, cap[0], this.lexer);
          }
        }
        reflink(src, links) {
          let cap;
          if ((cap = this.rules.inline.reflink.exec(src)) || (cap = this.rules.inline.nolink.exec(src))) {
            let link = (cap[2] || cap[1]).replace(/\s+/g, " ");
            link = links[link.toLowerCase()];
            if (!link) {
              const text = cap[0].charAt(0);
              return {
                type: "text",
                raw: text,
                text
              };
            }
            return outputLink(cap, link, cap[0], this.lexer);
          }
        }
        emStrong(src, maskedSrc, prevChar = "") {
          let match = this.rules.inline.emStrong.lDelim.exec(src);
          if (!match)
            return;
          if (match[3] && prevChar.match(/[\p{L}\p{N}]/u))
            return;
          const nextChar = match[1] || match[2] || "";
          if (!nextChar || !prevChar || this.rules.inline.punctuation.exec(prevChar)) {
            const lLength = [...match[0]].length - 1;
            let rDelim, rLength, delimTotal = lLength, midDelimTotal = 0;
            const endReg = match[0][0] === "*" ? this.rules.inline.emStrong.rDelimAst : this.rules.inline.emStrong.rDelimUnd;
            endReg.lastIndex = 0;
            maskedSrc = maskedSrc.slice(-1 * src.length + lLength);
            while ((match = endReg.exec(maskedSrc)) != null) {
              rDelim = match[1] || match[2] || match[3] || match[4] || match[5] || match[6];
              if (!rDelim)
                continue;
              rLength = [...rDelim].length;
              if (match[3] || match[4]) {
                delimTotal += rLength;
                continue;
              } else if (match[5] || match[6]) {
                if (lLength % 3 && !((lLength + rLength) % 3)) {
                  midDelimTotal += rLength;
                  continue;
                }
              }
              delimTotal -= rLength;
              if (delimTotal > 0)
                continue;
              rLength = Math.min(rLength, rLength + delimTotal + midDelimTotal);
              const lastCharLength = [...match[0]][0].length;
              const raw = src.slice(0, lLength + match.index + lastCharLength + rLength);
              if (Math.min(lLength, rLength) % 2) {
                const text2 = raw.slice(1, -1);
                return {
                  type: "em",
                  raw,
                  text: text2,
                  tokens: this.lexer.inlineTokens(text2)
                };
              }
              const text = raw.slice(2, -2);
              return {
                type: "strong",
                raw,
                text,
                tokens: this.lexer.inlineTokens(text)
              };
            }
          }
        }
        codespan(src) {
          const cap = this.rules.inline.code.exec(src);
          if (cap) {
            let text = cap[2].replace(/\n/g, " ");
            const hasNonSpaceChars = /[^ ]/.test(text);
            const hasSpaceCharsOnBothEnds = /^ /.test(text) && / $/.test(text);
            if (hasNonSpaceChars && hasSpaceCharsOnBothEnds) {
              text = text.substring(1, text.length - 1);
            }
            text = escape(text, true);
            return {
              type: "codespan",
              raw: cap[0],
              text
            };
          }
        }
        br(src) {
          const cap = this.rules.inline.br.exec(src);
          if (cap) {
            return {
              type: "br",
              raw: cap[0]
            };
          }
        }
        del(src) {
          const cap = this.rules.inline.del.exec(src);
          if (cap) {
            return {
              type: "del",
              raw: cap[0],
              text: cap[2],
              tokens: this.lexer.inlineTokens(cap[2])
            };
          }
        }
        autolink(src) {
          const cap = this.rules.inline.autolink.exec(src);
          if (cap) {
            let text, href;
            if (cap[2] === "@") {
              text = escape(cap[1]);
              href = "mailto:" + text;
            } else {
              text = escape(cap[1]);
              href = text;
            }
            return {
              type: "link",
              raw: cap[0],
              text,
              href,
              tokens: [
                {
                  type: "text",
                  raw: text,
                  text
                }
              ]
            };
          }
        }
        url(src) {
          let cap;
          if (cap = this.rules.inline.url.exec(src)) {
            let text, href;
            if (cap[2] === "@") {
              text = escape(cap[0]);
              href = "mailto:" + text;
            } else {
              let prevCapZero;
              do {
                prevCapZero = cap[0];
                cap[0] = this.rules.inline._backpedal.exec(cap[0])[0];
              } while (prevCapZero !== cap[0]);
              text = escape(cap[0]);
              if (cap[1] === "www.") {
                href = "http://" + cap[0];
              } else {
                href = cap[0];
              }
            }
            return {
              type: "link",
              raw: cap[0],
              text,
              href,
              tokens: [
                {
                  type: "text",
                  raw: text,
                  text
                }
              ]
            };
          }
        }
        inlineText(src) {
          const cap = this.rules.inline.text.exec(src);
          if (cap) {
            let text;
            if (this.lexer.state.inRawBlock) {
              text = cap[0];
            } else {
              text = escape(cap[0]);
            }
            return {
              type: "text",
              raw: cap[0],
              text
            };
          }
        }
      };
      block = {
        newline: /^(?: *(?:\n|$))+/,
        code: /^( {4}[^\n]+(?:\n(?: *(?:\n|$))*)?)+/,
        fences: /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/,
        hr: /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/,
        heading: /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/,
        blockquote: /^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/,
        list: /^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/,
        html: "^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n *)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$))",
        def: /^ {0,3}\[(label)\]: *(?:\n *)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n *)?| *\n *)(title))? *(?:\n+|$)/,
        table: noopTest,
        lheading: /^(?!bull )((?:.|\n(?!\s*?\n|bull ))+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
        // regex template, placeholders will be replaced according to different paragraph
        // interruption rules of commonmark and the original markdown spec:
        _paragraph: /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/,
        text: /^[^\n]+/
      };
      block._label = /(?!\s*\])(?:\\.|[^\[\]\\])+/;
      block._title = /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/;
      block.def = edit(block.def).replace("label", block._label).replace("title", block._title).getRegex();
      block.bullet = /(?:[*+-]|\d{1,9}[.)])/;
      block.listItemStart = edit(/^( *)(bull) */).replace("bull", block.bullet).getRegex();
      block.list = edit(block.list).replace(/bull/g, block.bullet).replace("hr", "\\n+(?=\\1?(?:(?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$))").replace("def", "\\n+(?=" + block.def.source + ")").getRegex();
      block._tag = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|section|source|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul";
      block._comment = /<!--(?!-?>)[\s\S]*?(?:-->|$)/;
      block.html = edit(block.html, "i").replace("comment", block._comment).replace("tag", block._tag).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex();
      block.lheading = edit(block.lheading).replace(/bull/g, block.bullet).getRegex();
      block.paragraph = edit(block._paragraph).replace("hr", block.hr).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", block._tag).getRegex();
      block.blockquote = edit(block.blockquote).replace("paragraph", block.paragraph).getRegex();
      block.normal = { ...block };
      block.gfm = {
        ...block.normal,
        table: "^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)"
        // Cells
      };
      block.gfm.table = edit(block.gfm.table).replace("hr", block.hr).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", " {4}[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", block._tag).getRegex();
      block.gfm.paragraph = edit(block._paragraph).replace("hr", block.hr).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", block.gfm.table).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", block._tag).getRegex();
      block.pedantic = {
        ...block.normal,
        html: edit(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment", block._comment).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),
        def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
        heading: /^(#{1,6})(.*)(?:\n+|$)/,
        fences: noopTest,
        lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
        paragraph: edit(block.normal._paragraph).replace("hr", block.hr).replace("heading", " *#{1,6} *[^\n]").replace("lheading", block.lheading).replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").getRegex()
      };
      inline = {
        escape: /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/,
        autolink: /^<(scheme:[^\s\x00-\x1f<>]*|email)>/,
        url: noopTest,
        tag: "^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>",
        link: /^!?\[(label)\]\(\s*(href)(?:\s+(title))?\s*\)/,
        reflink: /^!?\[(label)\]\[(ref)\]/,
        nolink: /^!?\[(ref)\](?:\[\])?/,
        reflinkSearch: "reflink|nolink(?!\\()",
        emStrong: {
          lDelim: /^(?:\*+(?:((?!\*)[punct])|[^\s*]))|^_+(?:((?!_)[punct])|([^\s_]))/,
          //         (1) and (2) can only be a Right Delimiter. (3) and (4) can only be Left.  (5) and (6) can be either Left or Right.
          //         | Skip orphan inside strong      | Consume to delim | (1) #***              | (2) a***#, a***                    | (3) #***a, ***a                  | (4) ***#                 | (5) #***#                         | (6) a***a
          rDelimAst: /^[^_*]*?__[^_*]*?\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\*)[punct](\*+)(?=[\s]|$)|[^punct\s](\*+)(?!\*)(?=[punct\s]|$)|(?!\*)[punct\s](\*+)(?=[^punct\s])|[\s](\*+)(?!\*)(?=[punct])|(?!\*)[punct](\*+)(?!\*)(?=[punct])|[^punct\s](\*+)(?=[^punct\s])/,
          rDelimUnd: /^[^_*]*?\*\*[^_*]*?_[^_*]*?(?=\*\*)|[^_]+(?=[^_])|(?!_)[punct](_+)(?=[\s]|$)|[^punct\s](_+)(?!_)(?=[punct\s]|$)|(?!_)[punct\s](_+)(?=[^punct\s])|[\s](_+)(?!_)(?=[punct])|(?!_)[punct](_+)(?!_)(?=[punct])/
          // ^- Not allowed for _
        },
        code: /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/,
        br: /^( {2,}|\\)\n(?!\s*$)/,
        del: noopTest,
        text: /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/,
        punctuation: /^((?![*_])[\spunctuation])/
      };
      inline._punctuation = "\\p{P}$+<=>`^|~";
      inline.punctuation = edit(inline.punctuation, "u").replace(/punctuation/g, inline._punctuation).getRegex();
      inline.blockSkip = /\[[^[\]]*?\]\([^\(\)]*?\)|`[^`]*?`|<[^<>]*?>/g;
      inline.anyPunctuation = /\\[punct]/g;
      inline._escapes = /\\([punct])/g;
      inline._comment = edit(block._comment).replace("(?:-->|$)", "-->").getRegex();
      inline.emStrong.lDelim = edit(inline.emStrong.lDelim, "u").replace(/punct/g, inline._punctuation).getRegex();
      inline.emStrong.rDelimAst = edit(inline.emStrong.rDelimAst, "gu").replace(/punct/g, inline._punctuation).getRegex();
      inline.emStrong.rDelimUnd = edit(inline.emStrong.rDelimUnd, "gu").replace(/punct/g, inline._punctuation).getRegex();
      inline.anyPunctuation = edit(inline.anyPunctuation, "gu").replace(/punct/g, inline._punctuation).getRegex();
      inline._escapes = edit(inline._escapes, "gu").replace(/punct/g, inline._punctuation).getRegex();
      inline._scheme = /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/;
      inline._email = /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/;
      inline.autolink = edit(inline.autolink).replace("scheme", inline._scheme).replace("email", inline._email).getRegex();
      inline._attribute = /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/;
      inline.tag = edit(inline.tag).replace("comment", inline._comment).replace("attribute", inline._attribute).getRegex();
      inline._label = /(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/;
      inline._href = /<(?:\\.|[^\n<>\\])+>|[^\s\x00-\x1f]*/;
      inline._title = /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/;
      inline.link = edit(inline.link).replace("label", inline._label).replace("href", inline._href).replace("title", inline._title).getRegex();
      inline.reflink = edit(inline.reflink).replace("label", inline._label).replace("ref", block._label).getRegex();
      inline.nolink = edit(inline.nolink).replace("ref", block._label).getRegex();
      inline.reflinkSearch = edit(inline.reflinkSearch, "g").replace("reflink", inline.reflink).replace("nolink", inline.nolink).getRegex();
      inline.normal = { ...inline };
      inline.pedantic = {
        ...inline.normal,
        strong: {
          start: /^__|\*\*/,
          middle: /^__(?=\S)([\s\S]*?\S)__(?!_)|^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,
          endAst: /\*\*(?!\*)/g,
          endUnd: /__(?!_)/g
        },
        em: {
          start: /^_|\*/,
          middle: /^()\*(?=\S)([\s\S]*?\S)\*(?!\*)|^_(?=\S)([\s\S]*?\S)_(?!_)/,
          endAst: /\*(?!\*)/g,
          endUnd: /_(?!_)/g
        },
        link: edit(/^!?\[(label)\]\((.*?)\)/).replace("label", inline._label).getRegex(),
        reflink: edit(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", inline._label).getRegex()
      };
      inline.gfm = {
        ...inline.normal,
        escape: edit(inline.escape).replace("])", "~|])").getRegex(),
        _extended_email: /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/,
        url: /^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/,
        _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,
        del: /^(~~?)(?=[^\s~])([\s\S]*?[^\s~])\1(?=[^~]|$)/,
        text: /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/
      };
      inline.gfm.url = edit(inline.gfm.url, "i").replace("email", inline.gfm._extended_email).getRegex();
      inline.breaks = {
        ...inline.gfm,
        br: edit(inline.br).replace("{2,}", "*").getRegex(),
        text: edit(inline.gfm.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex()
      };
      _Lexer = class __Lexer {
        constructor(options2) {
          __publicField(this, "tokens");
          __publicField(this, "options");
          __publicField(this, "state");
          __publicField(this, "tokenizer");
          __publicField(this, "inlineQueue");
          this.tokens = [];
          this.tokens.links = /* @__PURE__ */ Object.create(null);
          this.options = options2 || _defaults;
          this.options.tokenizer = this.options.tokenizer || new _Tokenizer();
          this.tokenizer = this.options.tokenizer;
          this.tokenizer.options = this.options;
          this.tokenizer.lexer = this;
          this.inlineQueue = [];
          this.state = {
            inLink: false,
            inRawBlock: false,
            top: true
          };
          const rules = {
            block: block.normal,
            inline: inline.normal
          };
          if (this.options.pedantic) {
            rules.block = block.pedantic;
            rules.inline = inline.pedantic;
          } else if (this.options.gfm) {
            rules.block = block.gfm;
            if (this.options.breaks) {
              rules.inline = inline.breaks;
            } else {
              rules.inline = inline.gfm;
            }
          }
          this.tokenizer.rules = rules;
        }
        /**
         * Expose Rules
         */
        static get rules() {
          return {
            block,
            inline
          };
        }
        /**
         * Static Lex Method
         */
        static lex(src, options2) {
          const lexer2 = new __Lexer(options2);
          return lexer2.lex(src);
        }
        /**
         * Static Lex Inline Method
         */
        static lexInline(src, options2) {
          const lexer2 = new __Lexer(options2);
          return lexer2.inlineTokens(src);
        }
        /**
         * Preprocessing
         */
        lex(src) {
          src = src.replace(/\r\n|\r/g, "\n");
          this.blockTokens(src, this.tokens);
          let next;
          while (next = this.inlineQueue.shift()) {
            this.inlineTokens(next.src, next.tokens);
          }
          return this.tokens;
        }
        blockTokens(src, tokens = []) {
          if (this.options.pedantic) {
            src = src.replace(/\t/g, "    ").replace(/^ +$/gm, "");
          } else {
            src = src.replace(/^( *)(\t+)/gm, (_, leading, tabs) => {
              return leading + "    ".repeat(tabs.length);
            });
          }
          let token;
          let lastToken;
          let cutSrc;
          let lastParagraphClipped;
          while (src) {
            if (this.options.extensions && this.options.extensions.block && this.options.extensions.block.some((extTokenizer) => {
              if (token = extTokenizer.call({ lexer: this }, src, tokens)) {
                src = src.substring(token.raw.length);
                tokens.push(token);
                return true;
              }
              return false;
            })) {
              continue;
            }
            if (token = this.tokenizer.space(src)) {
              src = src.substring(token.raw.length);
              if (token.raw.length === 1 && tokens.length > 0) {
                tokens[tokens.length - 1].raw += "\n";
              } else {
                tokens.push(token);
              }
              continue;
            }
            if (token = this.tokenizer.code(src)) {
              src = src.substring(token.raw.length);
              lastToken = tokens[tokens.length - 1];
              if (lastToken && (lastToken.type === "paragraph" || lastToken.type === "text")) {
                lastToken.raw += "\n" + token.raw;
                lastToken.text += "\n" + token.text;
                this.inlineQueue[this.inlineQueue.length - 1].src = lastToken.text;
              } else {
                tokens.push(token);
              }
              continue;
            }
            if (token = this.tokenizer.fences(src)) {
              src = src.substring(token.raw.length);
              tokens.push(token);
              continue;
            }
            if (token = this.tokenizer.heading(src)) {
              src = src.substring(token.raw.length);
              tokens.push(token);
              continue;
            }
            if (token = this.tokenizer.hr(src)) {
              src = src.substring(token.raw.length);
              tokens.push(token);
              continue;
            }
            if (token = this.tokenizer.blockquote(src)) {
              src = src.substring(token.raw.length);
              tokens.push(token);
              continue;
            }
            if (token = this.tokenizer.list(src)) {
              src = src.substring(token.raw.length);
              tokens.push(token);
              continue;
            }
            if (token = this.tokenizer.html(src)) {
              src = src.substring(token.raw.length);
              tokens.push(token);
              continue;
            }
            if (token = this.tokenizer.def(src)) {
              src = src.substring(token.raw.length);
              lastToken = tokens[tokens.length - 1];
              if (lastToken && (lastToken.type === "paragraph" || lastToken.type === "text")) {
                lastToken.raw += "\n" + token.raw;
                lastToken.text += "\n" + token.raw;
                this.inlineQueue[this.inlineQueue.length - 1].src = lastToken.text;
              } else if (!this.tokens.links[token.tag]) {
                this.tokens.links[token.tag] = {
                  href: token.href,
                  title: token.title
                };
              }
              continue;
            }
            if (token = this.tokenizer.table(src)) {
              src = src.substring(token.raw.length);
              tokens.push(token);
              continue;
            }
            if (token = this.tokenizer.lheading(src)) {
              src = src.substring(token.raw.length);
              tokens.push(token);
              continue;
            }
            cutSrc = src;
            if (this.options.extensions && this.options.extensions.startBlock) {
              let startIndex = Infinity;
              const tempSrc = src.slice(1);
              let tempStart;
              this.options.extensions.startBlock.forEach((getStartIndex) => {
                tempStart = getStartIndex.call({ lexer: this }, tempSrc);
                if (typeof tempStart === "number" && tempStart >= 0) {
                  startIndex = Math.min(startIndex, tempStart);
                }
              });
              if (startIndex < Infinity && startIndex >= 0) {
                cutSrc = src.substring(0, startIndex + 1);
              }
            }
            if (this.state.top && (token = this.tokenizer.paragraph(cutSrc))) {
              lastToken = tokens[tokens.length - 1];
              if (lastParagraphClipped && lastToken.type === "paragraph") {
                lastToken.raw += "\n" + token.raw;
                lastToken.text += "\n" + token.text;
                this.inlineQueue.pop();
                this.inlineQueue[this.inlineQueue.length - 1].src = lastToken.text;
              } else {
                tokens.push(token);
              }
              lastParagraphClipped = cutSrc.length !== src.length;
              src = src.substring(token.raw.length);
              continue;
            }
            if (token = this.tokenizer.text(src)) {
              src = src.substring(token.raw.length);
              lastToken = tokens[tokens.length - 1];
              if (lastToken && lastToken.type === "text") {
                lastToken.raw += "\n" + token.raw;
                lastToken.text += "\n" + token.text;
                this.inlineQueue.pop();
                this.inlineQueue[this.inlineQueue.length - 1].src = lastToken.text;
              } else {
                tokens.push(token);
              }
              continue;
            }
            if (src) {
              const errMsg = "Infinite loop on byte: " + src.charCodeAt(0);
              if (this.options.silent) {
                console.error(errMsg);
                break;
              } else {
                throw new Error(errMsg);
              }
            }
          }
          this.state.top = true;
          return tokens;
        }
        inline(src, tokens = []) {
          this.inlineQueue.push({ src, tokens });
          return tokens;
        }
        /**
         * Lexing/Compiling
         */
        inlineTokens(src, tokens = []) {
          let token, lastToken, cutSrc;
          let maskedSrc = src;
          let match;
          let keepPrevChar, prevChar;
          if (this.tokens.links) {
            const links = Object.keys(this.tokens.links);
            if (links.length > 0) {
              while ((match = this.tokenizer.rules.inline.reflinkSearch.exec(maskedSrc)) != null) {
                if (links.includes(match[0].slice(match[0].lastIndexOf("[") + 1, -1))) {
                  maskedSrc = maskedSrc.slice(0, match.index) + "[" + "a".repeat(match[0].length - 2) + "]" + maskedSrc.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex);
                }
              }
            }
          }
          while ((match = this.tokenizer.rules.inline.blockSkip.exec(maskedSrc)) != null) {
            maskedSrc = maskedSrc.slice(0, match.index) + "[" + "a".repeat(match[0].length - 2) + "]" + maskedSrc.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
          }
          while ((match = this.tokenizer.rules.inline.anyPunctuation.exec(maskedSrc)) != null) {
            maskedSrc = maskedSrc.slice(0, match.index) + "++" + maskedSrc.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);
          }
          while (src) {
            if (!keepPrevChar) {
              prevChar = "";
            }
            keepPrevChar = false;
            if (this.options.extensions && this.options.extensions.inline && this.options.extensions.inline.some((extTokenizer) => {
              if (token = extTokenizer.call({ lexer: this }, src, tokens)) {
                src = src.substring(token.raw.length);
                tokens.push(token);
                return true;
              }
              return false;
            })) {
              continue;
            }
            if (token = this.tokenizer.escape(src)) {
              src = src.substring(token.raw.length);
              tokens.push(token);
              continue;
            }
            if (token = this.tokenizer.tag(src)) {
              src = src.substring(token.raw.length);
              lastToken = tokens[tokens.length - 1];
              if (lastToken && token.type === "text" && lastToken.type === "text") {
                lastToken.raw += token.raw;
                lastToken.text += token.text;
              } else {
                tokens.push(token);
              }
              continue;
            }
            if (token = this.tokenizer.link(src)) {
              src = src.substring(token.raw.length);
              tokens.push(token);
              continue;
            }
            if (token = this.tokenizer.reflink(src, this.tokens.links)) {
              src = src.substring(token.raw.length);
              lastToken = tokens[tokens.length - 1];
              if (lastToken && token.type === "text" && lastToken.type === "text") {
                lastToken.raw += token.raw;
                lastToken.text += token.text;
              } else {
                tokens.push(token);
              }
              continue;
            }
            if (token = this.tokenizer.emStrong(src, maskedSrc, prevChar)) {
              src = src.substring(token.raw.length);
              tokens.push(token);
              continue;
            }
            if (token = this.tokenizer.codespan(src)) {
              src = src.substring(token.raw.length);
              tokens.push(token);
              continue;
            }
            if (token = this.tokenizer.br(src)) {
              src = src.substring(token.raw.length);
              tokens.push(token);
              continue;
            }
            if (token = this.tokenizer.del(src)) {
              src = src.substring(token.raw.length);
              tokens.push(token);
              continue;
            }
            if (token = this.tokenizer.autolink(src)) {
              src = src.substring(token.raw.length);
              tokens.push(token);
              continue;
            }
            if (!this.state.inLink && (token = this.tokenizer.url(src))) {
              src = src.substring(token.raw.length);
              tokens.push(token);
              continue;
            }
            cutSrc = src;
            if (this.options.extensions && this.options.extensions.startInline) {
              let startIndex = Infinity;
              const tempSrc = src.slice(1);
              let tempStart;
              this.options.extensions.startInline.forEach((getStartIndex) => {
                tempStart = getStartIndex.call({ lexer: this }, tempSrc);
                if (typeof tempStart === "number" && tempStart >= 0) {
                  startIndex = Math.min(startIndex, tempStart);
                }
              });
              if (startIndex < Infinity && startIndex >= 0) {
                cutSrc = src.substring(0, startIndex + 1);
              }
            }
            if (token = this.tokenizer.inlineText(cutSrc)) {
              src = src.substring(token.raw.length);
              if (token.raw.slice(-1) !== "_") {
                prevChar = token.raw.slice(-1);
              }
              keepPrevChar = true;
              lastToken = tokens[tokens.length - 1];
              if (lastToken && lastToken.type === "text") {
                lastToken.raw += token.raw;
                lastToken.text += token.text;
              } else {
                tokens.push(token);
              }
              continue;
            }
            if (src) {
              const errMsg = "Infinite loop on byte: " + src.charCodeAt(0);
              if (this.options.silent) {
                console.error(errMsg);
                break;
              } else {
                throw new Error(errMsg);
              }
            }
          }
          return tokens;
        }
      };
      _Renderer = class {
        constructor(options2) {
          __publicField(this, "options");
          this.options = options2 || _defaults;
        }
        code(code, infostring, escaped) {
          var _a;
          const lang = (_a = (infostring || "").match(/^\S*/)) == null ? void 0 : _a[0];
          code = code.replace(/\n$/, "") + "\n";
          if (!lang) {
            return "<pre><code>" + (escaped ? code : escape(code, true)) + "</code></pre>\n";
          }
          return '<pre><code class="language-' + escape(lang) + '">' + (escaped ? code : escape(code, true)) + "</code></pre>\n";
        }
        blockquote(quote) {
          return `<blockquote>
${quote}</blockquote>
`;
        }
        html(html, block2) {
          return html;
        }
        heading(text, level, raw) {
          return `<h${level}>${text}</h${level}>
`;
        }
        hr() {
          return "<hr>\n";
        }
        list(body, ordered, start) {
          const type = ordered ? "ol" : "ul";
          const startatt = ordered && start !== 1 ? ' start="' + start + '"' : "";
          return "<" + type + startatt + ">\n" + body + "</" + type + ">\n";
        }
        listitem(text, task, checked) {
          return `<li>${text}</li>
`;
        }
        checkbox(checked) {
          return "<input " + (checked ? 'checked="" ' : "") + 'disabled="" type="checkbox">';
        }
        paragraph(text) {
          return `<p>${text}</p>
`;
        }
        table(header, body) {
          if (body)
            body = `<tbody>${body}</tbody>`;
          return "<table>\n<thead>\n" + header + "</thead>\n" + body + "</table>\n";
        }
        tablerow(content) {
          return `<tr>
${content}</tr>
`;
        }
        tablecell(content, flags) {
          const type = flags.header ? "th" : "td";
          const tag = flags.align ? `<${type} align="${flags.align}">` : `<${type}>`;
          return tag + content + `</${type}>
`;
        }
        /**
         * span level renderer
         */
        strong(text) {
          return `<strong>${text}</strong>`;
        }
        em(text) {
          return `<em>${text}</em>`;
        }
        codespan(text) {
          return `<code>${text}</code>`;
        }
        br() {
          return "<br>";
        }
        del(text) {
          return `<del>${text}</del>`;
        }
        link(href, title, text) {
          const cleanHref = cleanUrl(href);
          if (cleanHref === null) {
            return text;
          }
          href = cleanHref;
          let out = '<a href="' + href + '"';
          if (title) {
            out += ' title="' + title + '"';
          }
          out += ">" + text + "</a>";
          return out;
        }
        image(href, title, text) {
          const cleanHref = cleanUrl(href);
          if (cleanHref === null) {
            return text;
          }
          href = cleanHref;
          let out = `<img src="${href}" alt="${text}"`;
          if (title) {
            out += ` title="${title}"`;
          }
          out += ">";
          return out;
        }
        text(text) {
          return text;
        }
      };
      _TextRenderer = class {
        // no need for block level renderers
        strong(text) {
          return text;
        }
        em(text) {
          return text;
        }
        codespan(text) {
          return text;
        }
        del(text) {
          return text;
        }
        html(text) {
          return text;
        }
        text(text) {
          return text;
        }
        link(href, title, text) {
          return "" + text;
        }
        image(href, title, text) {
          return "" + text;
        }
        br() {
          return "";
        }
      };
      _Parser = class __Parser {
        constructor(options2) {
          __publicField(this, "options");
          __publicField(this, "renderer");
          __publicField(this, "textRenderer");
          this.options = options2 || _defaults;
          this.options.renderer = this.options.renderer || new _Renderer();
          this.renderer = this.options.renderer;
          this.renderer.options = this.options;
          this.textRenderer = new _TextRenderer();
        }
        /**
         * Static Parse Method
         */
        static parse(tokens, options2) {
          const parser2 = new __Parser(options2);
          return parser2.parse(tokens);
        }
        /**
         * Static Parse Inline Method
         */
        static parseInline(tokens, options2) {
          const parser2 = new __Parser(options2);
          return parser2.parseInline(tokens);
        }
        /**
         * Parse Loop
         */
        parse(tokens, top = true) {
          let out = "";
          for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            if (this.options.extensions && this.options.extensions.renderers && this.options.extensions.renderers[token.type]) {
              const genericToken = token;
              const ret = this.options.extensions.renderers[genericToken.type].call({ parser: this }, genericToken);
              if (ret !== false || !["space", "hr", "heading", "code", "table", "blockquote", "list", "html", "paragraph", "text"].includes(genericToken.type)) {
                out += ret || "";
                continue;
              }
            }
            switch (token.type) {
              case "space": {
                continue;
              }
              case "hr": {
                out += this.renderer.hr();
                continue;
              }
              case "heading": {
                const headingToken = token;
                out += this.renderer.heading(this.parseInline(headingToken.tokens), headingToken.depth, unescape(this.parseInline(headingToken.tokens, this.textRenderer)));
                continue;
              }
              case "code": {
                const codeToken = token;
                out += this.renderer.code(codeToken.text, codeToken.lang, !!codeToken.escaped);
                continue;
              }
              case "table": {
                const tableToken = token;
                let header = "";
                let cell = "";
                for (let j = 0; j < tableToken.header.length; j++) {
                  cell += this.renderer.tablecell(this.parseInline(tableToken.header[j].tokens), { header: true, align: tableToken.align[j] });
                }
                header += this.renderer.tablerow(cell);
                let body = "";
                for (let j = 0; j < tableToken.rows.length; j++) {
                  const row = tableToken.rows[j];
                  cell = "";
                  for (let k = 0; k < row.length; k++) {
                    cell += this.renderer.tablecell(this.parseInline(row[k].tokens), { header: false, align: tableToken.align[k] });
                  }
                  body += this.renderer.tablerow(cell);
                }
                out += this.renderer.table(header, body);
                continue;
              }
              case "blockquote": {
                const blockquoteToken = token;
                const body = this.parse(blockquoteToken.tokens);
                out += this.renderer.blockquote(body);
                continue;
              }
              case "list": {
                const listToken = token;
                const ordered = listToken.ordered;
                const start = listToken.start;
                const loose = listToken.loose;
                let body = "";
                for (let j = 0; j < listToken.items.length; j++) {
                  const item = listToken.items[j];
                  const checked = item.checked;
                  const task = item.task;
                  let itemBody = "";
                  if (item.task) {
                    const checkbox = this.renderer.checkbox(!!checked);
                    if (loose) {
                      if (item.tokens.length > 0 && item.tokens[0].type === "paragraph") {
                        item.tokens[0].text = checkbox + " " + item.tokens[0].text;
                        if (item.tokens[0].tokens && item.tokens[0].tokens.length > 0 && item.tokens[0].tokens[0].type === "text") {
                          item.tokens[0].tokens[0].text = checkbox + " " + item.tokens[0].tokens[0].text;
                        }
                      } else {
                        item.tokens.unshift({
                          type: "text",
                          text: checkbox + " "
                        });
                      }
                    } else {
                      itemBody += checkbox + " ";
                    }
                  }
                  itemBody += this.parse(item.tokens, loose);
                  body += this.renderer.listitem(itemBody, task, !!checked);
                }
                out += this.renderer.list(body, ordered, start);
                continue;
              }
              case "html": {
                const htmlToken = token;
                out += this.renderer.html(htmlToken.text, htmlToken.block);
                continue;
              }
              case "paragraph": {
                const paragraphToken = token;
                out += this.renderer.paragraph(this.parseInline(paragraphToken.tokens));
                continue;
              }
              case "text": {
                let textToken = token;
                let body = textToken.tokens ? this.parseInline(textToken.tokens) : textToken.text;
                while (i + 1 < tokens.length && tokens[i + 1].type === "text") {
                  textToken = tokens[++i];
                  body += "\n" + (textToken.tokens ? this.parseInline(textToken.tokens) : textToken.text);
                }
                out += top ? this.renderer.paragraph(body) : body;
                continue;
              }
              default: {
                const errMsg = 'Token with "' + token.type + '" type was not found.';
                if (this.options.silent) {
                  console.error(errMsg);
                  return "";
                } else {
                  throw new Error(errMsg);
                }
              }
            }
          }
          return out;
        }
        /**
         * Parse Inline Tokens
         */
        parseInline(tokens, renderer) {
          renderer = renderer || this.renderer;
          let out = "";
          for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            if (this.options.extensions && this.options.extensions.renderers && this.options.extensions.renderers[token.type]) {
              const ret = this.options.extensions.renderers[token.type].call({ parser: this }, token);
              if (ret !== false || !["escape", "html", "link", "image", "strong", "em", "codespan", "br", "del", "text"].includes(token.type)) {
                out += ret || "";
                continue;
              }
            }
            switch (token.type) {
              case "escape": {
                const escapeToken = token;
                out += renderer.text(escapeToken.text);
                break;
              }
              case "html": {
                const tagToken = token;
                out += renderer.html(tagToken.text);
                break;
              }
              case "link": {
                const linkToken = token;
                out += renderer.link(linkToken.href, linkToken.title, this.parseInline(linkToken.tokens, renderer));
                break;
              }
              case "image": {
                const imageToken = token;
                out += renderer.image(imageToken.href, imageToken.title, imageToken.text);
                break;
              }
              case "strong": {
                const strongToken = token;
                out += renderer.strong(this.parseInline(strongToken.tokens, renderer));
                break;
              }
              case "em": {
                const emToken = token;
                out += renderer.em(this.parseInline(emToken.tokens, renderer));
                break;
              }
              case "codespan": {
                const codespanToken = token;
                out += renderer.codespan(codespanToken.text);
                break;
              }
              case "br": {
                out += renderer.br();
                break;
              }
              case "del": {
                const delToken = token;
                out += renderer.del(this.parseInline(delToken.tokens, renderer));
                break;
              }
              case "text": {
                const textToken = token;
                out += renderer.text(textToken.text);
                break;
              }
              default: {
                const errMsg = 'Token with "' + token.type + '" type was not found.';
                if (this.options.silent) {
                  console.error(errMsg);
                  return "";
                } else {
                  throw new Error(errMsg);
                }
              }
            }
          }
          return out;
        }
      };
      _Hooks = class {
        constructor(options2) {
          __publicField(this, "options");
          this.options = options2 || _defaults;
        }
        /**
         * Process markdown before marked
         */
        preprocess(markdown) {
          return markdown;
        }
        /**
         * Process HTML after marked is finished
         */
        postprocess(html) {
          return html;
        }
      };
      __publicField(_Hooks, "passThroughHooks", /* @__PURE__ */ new Set([
        "preprocess",
        "postprocess"
      ]));
      Marked = class {
        constructor(...args) {
          __privateAdd(this, _parseMarkdown);
          __privateAdd(this, _onError);
          __publicField(this, "defaults", _getDefaults());
          __publicField(this, "options", this.setOptions);
          __publicField(this, "parse", __privateMethod(this, _parseMarkdown, parseMarkdown_fn).call(this, _Lexer.lex, _Parser.parse));
          __publicField(this, "parseInline", __privateMethod(this, _parseMarkdown, parseMarkdown_fn).call(this, _Lexer.lexInline, _Parser.parseInline));
          __publicField(this, "Parser", _Parser);
          __publicField(this, "Renderer", _Renderer);
          __publicField(this, "TextRenderer", _TextRenderer);
          __publicField(this, "Lexer", _Lexer);
          __publicField(this, "Tokenizer", _Tokenizer);
          __publicField(this, "Hooks", _Hooks);
          this.use(...args);
        }
        /**
         * Run callback for every token
         */
        walkTokens(tokens, callback) {
          var _a, _b;
          let values = [];
          for (const token of tokens) {
            values = values.concat(callback.call(this, token));
            switch (token.type) {
              case "table": {
                const tableToken = token;
                for (const cell of tableToken.header) {
                  values = values.concat(this.walkTokens(cell.tokens, callback));
                }
                for (const row of tableToken.rows) {
                  for (const cell of row) {
                    values = values.concat(this.walkTokens(cell.tokens, callback));
                  }
                }
                break;
              }
              case "list": {
                const listToken = token;
                values = values.concat(this.walkTokens(listToken.items, callback));
                break;
              }
              default: {
                const genericToken = token;
                if ((_b = (_a = this.defaults.extensions) == null ? void 0 : _a.childTokens) == null ? void 0 : _b[genericToken.type]) {
                  this.defaults.extensions.childTokens[genericToken.type].forEach((childTokens) => {
                    values = values.concat(this.walkTokens(genericToken[childTokens], callback));
                  });
                } else if (genericToken.tokens) {
                  values = values.concat(this.walkTokens(genericToken.tokens, callback));
                }
              }
            }
          }
          return values;
        }
        use(...args) {
          const extensions = this.defaults.extensions || { renderers: {}, childTokens: {} };
          args.forEach((pack) => {
            const opts = { ...pack };
            opts.async = this.defaults.async || opts.async || false;
            if (pack.extensions) {
              pack.extensions.forEach((ext) => {
                if (!ext.name) {
                  throw new Error("extension name required");
                }
                if ("renderer" in ext) {
                  const prevRenderer = extensions.renderers[ext.name];
                  if (prevRenderer) {
                    extensions.renderers[ext.name] = function(...args2) {
                      let ret = ext.renderer.apply(this, args2);
                      if (ret === false) {
                        ret = prevRenderer.apply(this, args2);
                      }
                      return ret;
                    };
                  } else {
                    extensions.renderers[ext.name] = ext.renderer;
                  }
                }
                if ("tokenizer" in ext) {
                  if (!ext.level || ext.level !== "block" && ext.level !== "inline") {
                    throw new Error("extension level must be 'block' or 'inline'");
                  }
                  const extLevel = extensions[ext.level];
                  if (extLevel) {
                    extLevel.unshift(ext.tokenizer);
                  } else {
                    extensions[ext.level] = [ext.tokenizer];
                  }
                  if (ext.start) {
                    if (ext.level === "block") {
                      if (extensions.startBlock) {
                        extensions.startBlock.push(ext.start);
                      } else {
                        extensions.startBlock = [ext.start];
                      }
                    } else if (ext.level === "inline") {
                      if (extensions.startInline) {
                        extensions.startInline.push(ext.start);
                      } else {
                        extensions.startInline = [ext.start];
                      }
                    }
                  }
                }
                if ("childTokens" in ext && ext.childTokens) {
                  extensions.childTokens[ext.name] = ext.childTokens;
                }
              });
              opts.extensions = extensions;
            }
            if (pack.renderer) {
              const renderer = this.defaults.renderer || new _Renderer(this.defaults);
              for (const prop in pack.renderer) {
                const rendererFunc = pack.renderer[prop];
                const rendererKey = prop;
                const prevRenderer = renderer[rendererKey];
                renderer[rendererKey] = (...args2) => {
                  let ret = rendererFunc.apply(renderer, args2);
                  if (ret === false) {
                    ret = prevRenderer.apply(renderer, args2);
                  }
                  return ret || "";
                };
              }
              opts.renderer = renderer;
            }
            if (pack.tokenizer) {
              const tokenizer = this.defaults.tokenizer || new _Tokenizer(this.defaults);
              for (const prop in pack.tokenizer) {
                const tokenizerFunc = pack.tokenizer[prop];
                const tokenizerKey = prop;
                const prevTokenizer = tokenizer[tokenizerKey];
                tokenizer[tokenizerKey] = (...args2) => {
                  let ret = tokenizerFunc.apply(tokenizer, args2);
                  if (ret === false) {
                    ret = prevTokenizer.apply(tokenizer, args2);
                  }
                  return ret;
                };
              }
              opts.tokenizer = tokenizer;
            }
            if (pack.hooks) {
              const hooks = this.defaults.hooks || new _Hooks();
              for (const prop in pack.hooks) {
                const hooksFunc = pack.hooks[prop];
                const hooksKey = prop;
                const prevHook = hooks[hooksKey];
                if (_Hooks.passThroughHooks.has(prop)) {
                  hooks[hooksKey] = (arg) => {
                    if (this.defaults.async) {
                      return Promise.resolve(hooksFunc.call(hooks, arg)).then((ret2) => {
                        return prevHook.call(hooks, ret2);
                      });
                    }
                    const ret = hooksFunc.call(hooks, arg);
                    return prevHook.call(hooks, ret);
                  };
                } else {
                  hooks[hooksKey] = (...args2) => {
                    let ret = hooksFunc.apply(hooks, args2);
                    if (ret === false) {
                      ret = prevHook.apply(hooks, args2);
                    }
                    return ret;
                  };
                }
              }
              opts.hooks = hooks;
            }
            if (pack.walkTokens) {
              const walkTokens2 = this.defaults.walkTokens;
              const packWalktokens = pack.walkTokens;
              opts.walkTokens = function(token) {
                let values = [];
                values.push(packWalktokens.call(this, token));
                if (walkTokens2) {
                  values = values.concat(walkTokens2.call(this, token));
                }
                return values;
              };
            }
            this.defaults = { ...this.defaults, ...opts };
          });
          return this;
        }
        setOptions(opt) {
          this.defaults = { ...this.defaults, ...opt };
          return this;
        }
        lexer(src, options2) {
          return _Lexer.lex(src, options2 != null ? options2 : this.defaults);
        }
        parser(tokens, options2) {
          return _Parser.parse(tokens, options2 != null ? options2 : this.defaults);
        }
      };
      _parseMarkdown = new WeakSet();
      parseMarkdown_fn = function(lexer2, parser2) {
        return (src, options2) => {
          const origOpt = { ...options2 };
          const opt = { ...this.defaults, ...origOpt };
          if (this.defaults.async === true && origOpt.async === false) {
            if (!opt.silent) {
              console.warn("marked(): The async option was set to true by an extension. The async: false option sent to parse will be ignored.");
            }
            opt.async = true;
          }
          const throwError = __privateMethod(this, _onError, onError_fn).call(this, !!opt.silent, !!opt.async);
          if (typeof src === "undefined" || src === null) {
            return throwError(new Error("marked(): input parameter is undefined or null"));
          }
          if (typeof src !== "string") {
            return throwError(new Error("marked(): input parameter is of type " + Object.prototype.toString.call(src) + ", string expected"));
          }
          if (opt.hooks) {
            opt.hooks.options = opt;
          }
          if (opt.async) {
            return Promise.resolve(opt.hooks ? opt.hooks.preprocess(src) : src).then((src2) => lexer2(src2, opt)).then((tokens) => opt.walkTokens ? Promise.all(this.walkTokens(tokens, opt.walkTokens)).then(() => tokens) : tokens).then((tokens) => parser2(tokens, opt)).then((html) => opt.hooks ? opt.hooks.postprocess(html) : html).catch(throwError);
          }
          try {
            if (opt.hooks) {
              src = opt.hooks.preprocess(src);
            }
            const tokens = lexer2(src, opt);
            if (opt.walkTokens) {
              this.walkTokens(tokens, opt.walkTokens);
            }
            let html = parser2(tokens, opt);
            if (opt.hooks) {
              html = opt.hooks.postprocess(html);
            }
            return html;
          } catch (e) {
            return throwError(e);
          }
        };
      };
      _onError = new WeakSet();
      onError_fn = function(silent, async) {
        return (e) => {
          e.message += "\nPlease report this to https://github.com/markedjs/marked.";
          if (silent) {
            const msg = "<p>An error occurred:</p><pre>" + escape(e.message + "", true) + "</pre>";
            if (async) {
              return Promise.resolve(msg);
            }
            return msg;
          }
          if (async) {
            return Promise.reject(e);
          }
          throw e;
        };
      };
      markedInstance = new Marked();
      marked.options = marked.setOptions = function(options2) {
        markedInstance.setOptions(options2);
        marked.defaults = markedInstance.defaults;
        changeDefaults(marked.defaults);
        return marked;
      };
      marked.getDefaults = _getDefaults;
      marked.defaults = _defaults;
      marked.use = function(...args) {
        markedInstance.use(...args);
        marked.defaults = markedInstance.defaults;
        changeDefaults(marked.defaults);
        return marked;
      };
      marked.walkTokens = function(tokens, callback) {
        return markedInstance.walkTokens(tokens, callback);
      };
      marked.parseInline = markedInstance.parseInline;
      marked.Parser = _Parser;
      marked.parser = _Parser.parse;
      marked.Renderer = _Renderer;
      marked.TextRenderer = _TextRenderer;
      marked.Lexer = _Lexer;
      marked.lexer = _Lexer.lex;
      marked.Tokenizer = _Tokenizer;
      marked.Hooks = _Hooks;
      marked.parse = marked;
      options = marked.options;
      setOptions = marked.setOptions;
      use = marked.use;
      walkTokens = marked.walkTokens;
      parseInline = marked.parseInline;
      parser = _Parser.parse;
      lexer = _Lexer.lex;
    }
  });

  // css-text:C:\Users\ferry\flow-documentation-framework\src\style.css
  var style_default;
  var init_style = __esm({
    "css-text:C:\\Users\\ferry\\flow-documentation-framework\\src\\style.css"() {
      style_default = "/* \u2500\u2500 Variables \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\n.flow-docs-root {\n  --fd-bg:        #0f1117;\n  --fd-bg2:       #161b22;\n  --fd-bg3:       #1c2128;\n  --fd-border:    #30363d;\n  --fd-text:      #e6edf3;\n  --fd-text2:     #8b949e;\n  --fd-text3:     #6e7681;\n  --fd-accent:    #58a6ff;\n  --fd-accent-bg: #1f3d5c;\n  --fd-green:     #3fb950;\n  --fd-yellow:    #d29922;\n  --fd-red:       #f85149;\n  --fd-radius:    8px;\n  --fd-sidebar-w: 260px;\n  --fd-toc-w:     220px;\n  --fd-font-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;\n}\n\n/* \u2500\u2500 Reset (scoped) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\n.flow-docs-root *, .flow-docs-root *::before, .flow-docs-root *::after {\n  box-sizing: border-box;\n  margin: 0;\n  padding: 0;\n}\n\n.flow-docs-root {\n  display: flex;\n  width: 100%;\n  height: 100%;\n  overflow: hidden;\n  background: var(--fd-bg);\n  color: var(--fd-text);\n  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;\n  font-size: 14px;\n  line-height: 1.6;\n  position: relative;\n}\n\n/* \u2500\u2500 Sidebar \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\n.flow-docs-root .fd-sidebar {\n  width: var(--fd-sidebar-w);\n  flex-shrink: 0;\n  background: var(--fd-bg2);\n  border-right: 1px solid var(--fd-border);\n  display: flex;\n  flex-direction: column;\n  overflow: hidden;\n}\n\n.flow-docs-root .fd-sidebar-header {\n  padding: 16px 12px 12px;\n  border-bottom: 1px solid var(--fd-border);\n}\n\n.flow-docs-root .fd-logo {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  font-weight: 600;\n  font-size: 15px;\n  color: var(--fd-text);\n  margin-bottom: 12px;\n}\n.flow-docs-root .fd-logo svg { color: var(--fd-accent); }\n\n/* \u2500\u2500 Search box \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\n.flow-docs-root .fd-search-box {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  background: var(--fd-bg3);\n  border: 1px solid var(--fd-border);\n  border-radius: var(--fd-radius);\n  padding: 6px 10px;\n  transition: border-color .15s;\n  position: relative;\n}\n.flow-docs-root .fd-search-box:focus-within { border-color: var(--fd-accent); }\n.flow-docs-root .fd-search-box svg { color: var(--fd-text3); flex-shrink: 0; }\n.flow-docs-root .fd-search-box input {\n  flex: 1;\n  background: none;\n  border: none;\n  outline: none;\n  color: var(--fd-text);\n  font-size: 13px;\n  min-width: 0;\n}\n.flow-docs-root .fd-search-box input::placeholder { color: var(--fd-text3); }\n.flow-docs-root .fd-search-box kbd {\n  font-size: 10px;\n  color: var(--fd-text3);\n  background: var(--fd-bg2);\n  border: 1px solid var(--fd-border);\n  border-radius: 4px;\n  padding: 1px 4px;\n  flex-shrink: 0;\n}\n\n.flow-docs-root .fd-skill-list {\n  flex: 1;\n  overflow-y: auto;\n  padding: 8px 0;\n}\n.flow-docs-root .fd-skill-list::-webkit-scrollbar { width: 4px; }\n.flow-docs-root .fd-skill-list::-webkit-scrollbar-track { background: transparent; }\n.flow-docs-root .fd-skill-list::-webkit-scrollbar-thumb { background: var(--fd-border); border-radius: 2px; }\n\n.flow-docs-root .fd-skill-item {\n  padding: 8px 14px;\n  cursor: pointer;\n  border-radius: 6px;\n  margin: 1px 6px;\n  transition: background .1s;\n}\n.flow-docs-root .fd-skill-item:hover { background: var(--fd-bg3); }\n.flow-docs-root .fd-skill-item.active { background: var(--fd-accent-bg); }\n.flow-docs-root .fd-skill-item.active .fd-skill-name { color: var(--fd-accent); }\n\n.flow-docs-root .fd-skill-name {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  font-size: 13px;\n  font-weight: 500;\n  color: var(--fd-text);\n}\n.flow-docs-root .fd-skill-name svg { color: var(--fd-text3); flex-shrink: 0; }\n\n.flow-docs-root .fd-skill-desc {\n  font-size: 11px;\n  color: var(--fd-text3);\n  margin-top: 2px;\n  padding-left: 20px;\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n\n.flow-docs-root .fd-empty-state {\n  padding: 20px 14px;\n  color: var(--fd-text2);\n  font-size: 13px;\n  line-height: 1.7;\n}\n\n/* \u2500\u2500 Main \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\n.flow-docs-root .fd-main {\n  flex: 1;\n  display: flex;\n  overflow: hidden;\n  position: relative;\n}\n\n.flow-docs-root .fd-content-area {\n  flex: 1;\n  overflow-y: auto;\n  padding: 10px 48px 40px;\n  min-width: 0;\n}\n.flow-docs-root .fd-content-area::-webkit-scrollbar { width: 6px; }\n.flow-docs-root .fd-content-area::-webkit-scrollbar-track { background: transparent; }\n.flow-docs-root .fd-content-area::-webkit-scrollbar-thumb { background: var(--fd-border); border-radius: 3px; }\n\n.flow-docs-root .fd-hidden { display: none !important; }\n\n/* \u2500\u2500 Welcome \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\n.flow-docs-root .fd-welcome {\n  height: 100%;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\n.flow-docs-root .fd-welcome-inner {\n  text-align: center;\n  color: var(--fd-text2);\n}\n.flow-docs-root .fd-welcome-inner svg { color: var(--fd-text3); margin-bottom: 16px; }\n.flow-docs-root .fd-welcome-inner h1 { font-size: 24px; color: var(--fd-text); margin-bottom: 8px; }\n.flow-docs-root .fd-welcome-inner p { font-size: 14px; margin-bottom: 6px; }\n.flow-docs-root .fd-welcome-inner .fd-hint { font-size: 12px; color: var(--fd-text3); }\n.flow-docs-root .fd-welcome-inner kbd {\n  background: var(--fd-bg3);\n  border: 1px solid var(--fd-border);\n  border-radius: 4px;\n  padding: 1px 5px;\n  font-size: 11px;\n}\n\n/* \u2500\u2500 Markdown content \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\n.flow-docs-root .fd-skill-content h1 { font-size: 26px; font-weight: 700; margin: 0 0 8px; color: var(--fd-text); border-bottom: 1px solid var(--fd-border); padding-bottom: 12px; }\n.flow-docs-root .fd-skill-content h2 { font-size: 20px; font-weight: 600; margin: 36px 0 12px; color: var(--fd-text); border-bottom: 1px solid var(--fd-border); padding-bottom: 8px; }\n.flow-docs-root .fd-skill-content h3 { font-size: 16px; font-weight: 600; margin: 24px 0 8px; color: var(--fd-text); }\n.flow-docs-root .fd-skill-content h4 { font-size: 14px; font-weight: 600; margin: 16px 0 6px; color: var(--fd-text2); }\n.flow-docs-root .fd-skill-content p { margin: 0 0 14px; color: var(--fd-text); }\n.flow-docs-root .fd-skill-content ul, .flow-docs-root .fd-skill-content ol { margin: 0 0 14px 20px; color: var(--fd-text); }\n.flow-docs-root .fd-skill-content li { margin-bottom: 4px; }\n.flow-docs-root .fd-skill-content a { color: var(--fd-accent); text-decoration: none; }\n.flow-docs-root .fd-skill-content a:hover { text-decoration: underline; }\n.flow-docs-root .fd-skill-content strong { font-weight: 600; color: var(--fd-text); }\n.flow-docs-root .fd-skill-content em { font-style: italic; color: var(--fd-text2); }\n.flow-docs-root .fd-skill-content hr { border: none; border-top: 1px solid var(--fd-border); margin: 28px 0; }\n\n.flow-docs-root .fd-skill-content blockquote {\n  border-left: 3px solid var(--fd-accent);\n  margin: 0 0 14px;\n  padding: 8px 16px;\n  background: var(--fd-bg2);\n  border-radius: 0 var(--fd-radius) var(--fd-radius) 0;\n  color: var(--fd-text2);\n}\n\n.flow-docs-root .fd-skill-content table {\n  width: 100%;\n  border-collapse: collapse;\n  margin-bottom: 16px;\n  font-size: 13px;\n}\n.flow-docs-root .fd-skill-content th {\n  background: var(--fd-bg2);\n  padding: 8px 12px;\n  text-align: left;\n  border: 1px solid var(--fd-border);\n  font-weight: 600;\n}\n.flow-docs-root .fd-skill-content td {\n  padding: 7px 12px;\n  border: 1px solid var(--fd-border);\n}\n.flow-docs-root .fd-skill-content tr:nth-child(even) td { background: var(--fd-bg2); }\n\n.flow-docs-root .fd-skill-content code:not(pre code) {\n  background: var(--fd-bg3);\n  border: 1px solid var(--fd-border);\n  border-radius: 4px;\n  padding: 1px 6px;\n  font-family: var(--fd-font-mono);\n  font-size: 12px;\n  color: #e2a97e;\n}\n\n/* \u2500\u2500 Code blocks \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\n.flow-docs-root .fd-code-block {\n  margin: 12px 0 20px;\n  border: 1px solid var(--fd-border);\n  border-radius: var(--fd-radius);\n  overflow: hidden;\n}\n\n.flow-docs-root .fd-code-header {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 6px 14px;\n  background: var(--fd-bg3);\n  border-bottom: 1px solid var(--fd-border);\n}\n\n.flow-docs-root .fd-code-lang {\n  font-size: 11px;\n  font-family: var(--fd-font-mono);\n  color: var(--fd-text3);\n  text-transform: uppercase;\n  letter-spacing: .5px;\n}\n\n.flow-docs-root .fd-btn-copy {\n  display: flex;\n  align-items: center;\n  gap: 5px;\n  font-size: 12px;\n  color: var(--fd-text2);\n  background: none;\n  border: 1px solid transparent;\n  border-radius: 5px;\n  padding: 3px 8px;\n  cursor: pointer;\n  transition: all .15s;\n}\n.flow-docs-root .fd-btn-copy:hover {\n  color: var(--fd-text);\n  background: var(--fd-bg2);\n  border-color: var(--fd-border);\n}\n\n.flow-docs-root .fd-code-block pre {\n  margin: 0;\n  overflow-x: auto;\n  padding: 16px;\n  background: #0d1117;\n  font-size: 13px;\n  line-height: 1.6;\n}\n.flow-docs-root .fd-code-block pre::-webkit-scrollbar { height: 4px; }\n.flow-docs-root .fd-code-block pre::-webkit-scrollbar-thumb { background: var(--fd-border); border-radius: 2px; }\n\n/* \u2500\u2500 TOC \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\n.flow-docs-root .fd-toc {\n  width: var(--fd-toc-w);\n  flex-shrink: 0;\n  padding: 40px 16px 40px 10px;\n  overflow-y: auto;\n  display: none;\n  position: relative;\n}\n.flow-docs-root .fd-toc.visible { display: block; }\n\n.flow-docs-root .fd-toc-resizer {\n  position: absolute;\n  left: 0;\n  top: 0;\n  bottom: 0;\n  width: 4px;\n  cursor: col-resize;\n  background: transparent;\n  transition: background .15s;\n  z-index: 5;\n}\n.flow-docs-root .fd-toc-resizer:hover { background: var(--fd-border); }\n.flow-docs-root .fd-toc-resizer.dragging { background: var(--fd-accent); }\n\n.flow-docs-root .fd-toc-title {\n  font-size: 11px;\n  font-weight: 600;\n  text-transform: uppercase;\n  letter-spacing: .8px;\n  color: var(--fd-text3);\n  margin-bottom: 10px;\n}\n\n.flow-docs-root .fd-toc-list {\n  list-style: none;\n  border-left: 1px solid var(--fd-border);\n  padding-left: 12px;\n}\n.flow-docs-root .fd-toc-list li a {\n  display: block;\n  font-size: 12px;\n  color: var(--fd-text2);\n  text-decoration: none;\n  padding: 3px 0;\n  transition: color .1s;\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n.flow-docs-root .fd-toc-list li a:hover { color: var(--fd-accent); }\n.flow-docs-root .fd-toc-level-1 { font-weight: 600; }\n.flow-docs-root .fd-toc-level-2 { padding-left: 0; }\n.flow-docs-root .fd-toc-level-3 { padding-left: 12px; }\n\n/* \u2500\u2500 Search results \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\n.flow-docs-root .fd-search-header {\n  font-size: 13px;\n  color: var(--fd-text2);\n  margin-bottom: 20px;\n}\n\n.flow-docs-root .fd-search-result {\n  background: var(--fd-bg2);\n  border: 1px solid var(--fd-border);\n  border-radius: var(--fd-radius);\n  padding: 14px 16px;\n  margin-bottom: 10px;\n  cursor: pointer;\n  transition: border-color .15s;\n}\n.flow-docs-root .fd-search-result:hover { border-color: var(--fd-accent); }\n\n.flow-docs-root .fd-search-result-meta {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  margin-bottom: 6px;\n}\n\n.flow-docs-root .fd-tag {\n  font-size: 11px;\n  background: var(--fd-accent-bg);\n  color: var(--fd-accent);\n  padding: 2px 7px;\n  border-radius: 12px;\n  font-weight: 500;\n}\n\n.flow-docs-root .fd-file-path {\n  font-size: 11px;\n  color: var(--fd-text3);\n  font-family: var(--fd-font-mono);\n}\n\n.flow-docs-root .fd-search-result-match {\n  font-size: 13px;\n  color: var(--fd-text);\n  margin-bottom: 4px;\n  font-family: var(--fd-font-mono);\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n\n.flow-docs-root .fd-search-result-context {\n  font-size: 12px;\n  color: var(--fd-text2);\n  font-family: var(--fd-font-mono);\n  white-space: pre-wrap;\n  max-height: 60px;\n  overflow: hidden;\n}\n\n.flow-docs-root .fd-search-result-match mark,\n.flow-docs-root .fd-search-result-context mark {\n  background: #4a3500;\n  color: #e3b341;\n  border-radius: 2px;\n  padding: 0 2px;\n}\n\n.flow-docs-root .fd-search-empty {\n  color: var(--fd-text2);\n  padding: 20px 0;\n  font-size: 14px;\n}\n\n/* \u2500\u2500 Toast \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\n.flow-docs-root .fd-toast {\n  position: absolute;\n  bottom: 24px;\n  right: 24px;\n  background: var(--fd-bg3);\n  border: 1px solid var(--fd-border);\n  border-radius: var(--fd-radius);\n  padding: 8px 14px;\n  font-size: 13px;\n  color: var(--fd-green);\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  opacity: 0;\n  transform: translateY(8px);\n  transition: opacity .2s, transform .2s;\n  pointer-events: none;\n  z-index: 100;\n}\n.flow-docs-root .fd-toast.show { opacity: 1; transform: translateY(0); }\n\n/* \u2500\u2500 File tree \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\n.flow-docs-root .fd-skill-tree {\n  margin: 0 0 6px;\n}\n\n.flow-docs-root .fd-tree-dir-header {\n  display: flex;\n  align-items: center;\n  gap: 5px;\n  padding: 4px 14px;\n  font-size: 12px;\n  color: var(--fd-text2);\n  cursor: pointer;\n  user-select: none;\n  transition: color .1s;\n}\n.flow-docs-root .fd-tree-dir-header:hover { color: var(--fd-text); }\n.flow-docs-root .fd-tree-dir-header > svg { flex-shrink: 0; }\n.flow-docs-root .fd-tree-dir-header span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.flow-docs-root .fd-tree-chevron { transition: transform .15s; color: var(--fd-text3); flex-shrink: 0; }\n\n.flow-docs-root .fd-tree-count {\n  font-size: 10px;\n  color: var(--fd-text3);\n  background: var(--fd-bg3);\n  border-radius: 8px;\n  padding: 0 5px;\n  flex-shrink: 0;\n}\n\n.flow-docs-root .fd-tree-dir-children {\n  padding-left: 20px;\n}\n\n.flow-docs-root .fd-tree-file {\n  display: flex;\n  align-items: center;\n  gap: 5px;\n  padding: 3px 14px;\n  font-size: 12px;\n  color: var(--fd-text2);\n  cursor: pointer;\n  border-radius: 4px;\n  margin: 0 6px;\n  transition: background .1s, color .1s;\n}\n.flow-docs-root .fd-tree-file span {\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  min-width: 0;\n}\n.flow-docs-root .fd-tree-file:hover { background: var(--fd-bg3); color: var(--fd-text); }\n.flow-docs-root .fd-tree-file.active { background: var(--fd-accent-bg); color: var(--fd-accent); }\n.flow-docs-root .fd-tree-file svg { color: var(--fd-text3); flex-shrink: 0; }\n.flow-docs-root .fd-tree-file.active svg { color: var(--fd-accent); }\n\n/* \u2500\u2500 File breadcrumb \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\n.flow-docs-root .fd-file-header {\n  margin-bottom: 20px;\n  padding-bottom: 12px;\n  border-bottom: 1px solid var(--fd-border);\n}\n.flow-docs-root .fd-file-breadcrumb {\n  font-size: 12px;\n  color: var(--fd-text3);\n  font-family: var(--fd-font-mono);\n}\n\n/* \u2500\u2500 Error \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\n.flow-docs-root .fd-error {\n  background: #2d1215;\n  border: 1px solid #f85149;\n  border-radius: var(--fd-radius);\n  padding: 14px 16px;\n  color: var(--fd-red);\n  font-size: 13px;\n}\n\n/* \u2500\u2500 Search flags \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\n.flow-docs-root .fd-flag-suggestions {\n  position: absolute;\n  top: calc(100% + 6px);\n  left: 0;\n  right: 0;\n  background: var(--fd-bg3);\n  border: 1px solid var(--fd-border);\n  border-radius: var(--fd-radius);\n  overflow: hidden;\n  z-index: 50;\n  box-shadow: 0 4px 12px rgba(0,0,0,.4);\n}\n\n.flow-docs-root .fd-flag-suggestion {\n  display: flex;\n  align-items: center;\n  gap: 10px;\n  padding: 7px 12px;\n  cursor: pointer;\n  transition: background .1s;\n}\n.flow-docs-root .fd-flag-suggestion:hover { background: var(--fd-bg2); }\n.flow-docs-root .fd-flag-suggestion code {\n  font-family: var(--fd-font-mono);\n  font-size: 12px;\n  color: var(--fd-accent);\n  flex-shrink: 0;\n}\n.flow-docs-root .fd-flag-suggestion span {\n  font-size: 12px;\n  color: var(--fd-text2);\n}\n\n.flow-docs-root .fd-search-flags {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 4px;\n  padding: 6px 0 2px;\n}\n\n.flow-docs-root .fd-flag-chip {\n  font-size: 11px;\n  background: var(--fd-accent-bg);\n  color: var(--fd-accent);\n  border-radius: 10px;\n  padding: 1px 8px;\n  font-weight: 500;\n  white-space: nowrap;\n}\n\n.flow-docs-root .fd-search-filter-badges {\n  display: inline-flex;\n  gap: 4px;\n  vertical-align: middle;\n  margin-left: 6px;\n}\n\n/* \u2500\u2500 Priority badge & divider \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\n.flow-docs-root .fd-priority-badge {\n  font-size: 11px;\n  background: #3a2a00;\n  color: var(--fd-yellow);\n  border-radius: 10px;\n  padding: 1px 8px;\n  font-weight: 500;\n  white-space: nowrap;\n  margin-left: auto;\n}\n\n.flow-docs-root .fd-search-result.priority {\n  border-color: #3a2a00;\n}\n.flow-docs-root .fd-search-result.priority:hover {\n  border-color: var(--fd-yellow);\n}\n\n.flow-docs-root .fd-search-divider {\n  font-size: 11px;\n  color: var(--fd-text3);\n  text-transform: uppercase;\n  letter-spacing: .6px;\n  font-weight: 600;\n  padding: 14px 0 8px;\n  display: flex;\n  align-items: center;\n  gap: 10px;\n}\n.flow-docs-root .fd-search-divider::before,\n.flow-docs-root .fd-search-divider::after {\n  content: '';\n  flex: 1;\n  height: 1px;\n  background: var(--fd-border);\n}\n\n/* \u2500\u2500 Editor toolbar \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\n.flow-docs-root .fd-editor-toolbar {\n  position: sticky;\n  top: 0;\n  z-index: 10;\n  display: flex;\n  justify-content: flex-end;\n  align-items: center;\n  gap: 10px;\n  padding: 0 0 12px;\n  background: var(--fd-bg);\n}\n\n.flow-docs-root .fd-editor-switch {\n  display: flex;\n  align-items: center;\n  gap: 7px;\n  cursor: pointer;\n  user-select: none;\n  color: var(--fd-text2);\n  transition: color .15s;\n}\n.flow-docs-root .fd-editor-switch:hover { color: var(--fd-text); }\n.flow-docs-root .fd-editor-switch input { display: none; }\n\n.flow-docs-root .fd-switch-track {\n  width: 32px;\n  height: 18px;\n  background: var(--fd-bg3);\n  border: 1px solid var(--fd-border);\n  border-radius: 9px;\n  position: relative;\n  transition: background .2s, border-color .2s;\n  flex-shrink: 0;\n}\n.flow-docs-root .fd-switch-thumb {\n  position: absolute;\n  top: 2px;\n  left: 2px;\n  width: 12px;\n  height: 12px;\n  background: var(--fd-text3);\n  border-radius: 50%;\n  transition: left .2s, background .2s;\n}\n.flow-docs-root .fd-editor-switch input:checked + .fd-switch-track { background: var(--fd-accent-bg); border-color: var(--fd-accent); }\n.flow-docs-root .fd-editor-switch input:checked + .fd-switch-track .fd-switch-thumb { left: 16px; background: var(--fd-accent); }\n.flow-docs-root .fd-switch-label { font-size: 12px; }\n\n.flow-docs-root .fd-btn-save {\n  display: flex;\n  align-items: center;\n  gap: 5px;\n  padding: 5px 12px;\n  background: var(--fd-accent);\n  color: #fff;\n  border: none;\n  border-radius: var(--fd-radius);\n  font-size: 12px;\n  font-weight: 500;\n  cursor: pointer;\n  transition: opacity .15s;\n}\n.flow-docs-root .fd-btn-save:hover { opacity: .85; }\n.flow-docs-root .fd-btn-save:disabled { opacity: .5; cursor: not-allowed; }\n\n/* \u2500\u2500 Editor area \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\n.flow-docs-root .fd-editor-area {\n  min-height: 400px;\n}\n\n.flow-docs-root .fd-content-area.editor-mode-active {\n  display: flex;\n  flex-direction: column;\n  overflow: hidden;\n  padding-bottom: 16px;\n}\n.flow-docs-root .fd-content-area.editor-mode-active .fd-editor-toolbar {\n  position: relative;\n  flex-shrink: 0;\n}\n.flow-docs-root .fd-content-area.editor-mode-active .fd-editor-area {\n  flex: 1;\n  min-height: 0;\n  height: auto;\n}\n.flow-docs-root .fd-editor-textarea {\n  width: 100%;\n  height: 100%;\n  background: var(--fd-bg2);\n  border: 1px solid var(--fd-border);\n  border-radius: var(--fd-radius);\n  color: var(--fd-text);\n  font-family: var(--fd-font-mono);\n  font-size: 13px;\n  line-height: 1.7;\n  padding: 20px;\n  resize: none;\n  outline: none;\n  tab-size: 2;\n}\n.flow-docs-root .fd-editor-textarea:focus { border-color: var(--fd-accent); }\n\n/* \u2500\u2500 Scrollbar global \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\n.flow-docs-root ::-webkit-scrollbar { width: 6px; height: 6px; }\n.flow-docs-root ::-webkit-scrollbar-track { background: transparent; }\n.flow-docs-root ::-webkit-scrollbar-thumb { background: var(--fd-border); border-radius: 3px; }\n";
    }
  });

  // src/flow-docs.js
  var require_flow_docs = __commonJS({
    "src/flow-docs.js"(exports, module) {
      init_marked_esm();
      init_style();
      (function() {
        "use strict";
        const ICONS = {
          book: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
          search: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
          code: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
          copy: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
          check: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
          folder: '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
          save: '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>',
          fileMd: '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
          db: '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>',
          css: '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2"/><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48 2.83-2.83"/></svg>',
          chevron: '<svg class="fd-tree-chevron" xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>'
        };
        const FILE_ICONS = { md: "fileMd", vb: "code", js: "code", html: "code", cs: "code", sql: "db", css: "css" };
        function escHtml(str) {
          return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
        }
        function escAttr(str) {
          return String(str).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
        }
        function getExt(filePath) {
          const m = filePath.match(/\.([^.]+)$/);
          return m ? m[1].toLowerCase() : "";
        }
        function createMarked() {
          const m = marked;
          m.use({
            renderer: {
              code(code, lang) {
                lang = lang || "plaintext";
                const escaped = String(code).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                return `
<div class="fd-code-block">
  <div class="fd-code-header">
    <span class="fd-code-lang">${lang}</span>
    <button class="fd-btn-copy" title="Copiar c\xF3digo">
      ${ICONS.copy} Copiar
    </button>
  </div>
  <pre><code class="hljs language-${lang}">${escaped}</code></pre>
</div>`;
              }
            }
          });
          return m;
        }
        function extractSections(markdown) {
          const sections = [];
          const lines = markdown.split("\n");
          for (const line of lines) {
            const m = line.match(/^(#{1,3})\s+(.+)/);
            if (m) {
              const level = m[1].length;
              const title = m[2].trim();
              const id = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
              sections.push({ level, title, id });
            }
          }
          return sections;
        }
        function resolveFileRefs(content, files) {
          return content.replace(/\[([^\]]+)\]\((?!https?:\/\/)([^)]+)\)/g, (match, text, ref) => {
            const normalizedRef = ref.replace(/\\/g, "/");
            if (files[normalizedRef] !== void 0) {
              const ext = getExt(ref);
              return `**${text}** (\`${ref}\`)
\`\`\`${ext}
${files[normalizedRef]}
\`\`\``;
            }
            return match;
          });
        }
        function addHeadingIds(content) {
          return content.replace(/^(#{1,3})\s+(.+)$/gm, (match, hashes, title) => {
            const id = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
            return `${hashes} <a id="${id}"></a>${title}`;
          });
        }
        function searchSkills(data, query, activeFlags) {
          const q = query.toLowerCase();
          const results = [];
          const ALL_EXTS = [".md", ".vb", ".sql", ".html", ".js", ".txt", ".cs"];
          const flagMap = {};
          for (const f of data.flags)
            flagMap[f.flag] = f;
          let allowedDirs = null;
          let allowedExts = null;
          if (activeFlags.length > 0) {
            const dirSet = /* @__PURE__ */ new Set();
            const extSet = /* @__PURE__ */ new Set();
            let anyDirRestriction = false;
            let anyExtRestriction = false;
            for (const flagName of activeFlags) {
              const flagDef = flagMap[flagName];
              if (!flagDef)
                continue;
              if (flagDef.dirs !== null) {
                anyDirRestriction = true;
                flagDef.dirs.forEach((d) => dirSet.add(d));
              }
              if (flagDef.exts !== null) {
                anyExtRestriction = true;
                flagDef.exts.forEach((e) => extSet.add(e));
              }
            }
            if (anyDirRestriction)
              allowedDirs = dirSet;
            if (anyExtRestriction)
              allowedExts = extSet;
          }
          const collectLimit = activeFlags.length > 0 ? 150 : 50;
          for (const skill of data.skills) {
            for (const [filePath, fileContent] of Object.entries(skill.files)) {
              const ext = "." + getExt(filePath);
              if (!ALL_EXTS.includes(ext))
                continue;
              const flagOnlyMode = q.length < 2;
              const dirParts = filePath.split("/");
              const topDir = dirParts.length > 1 ? dirParts[0] : null;
              const isRoot = dirParts.length === 1;
              if (!flagOnlyMode && allowedDirs !== null) {
                if (isRoot)
                  continue;
                if (!allowedDirs.has(topDir))
                  continue;
              }
              if (!flagOnlyMode && allowedExts !== null && !allowedExts.has(ext))
                continue;
              const lines = fileContent.split("\n");
              const priorityLineSet = /* @__PURE__ */ new Set();
              if (activeFlags.length > 0) {
                const ZONE_LINES = 50;
                for (const flagName of activeFlags) {
                  const tagName = flagName.replace(/^--/, "");
                  for (let i = 0; i < lines.length; i++) {
                    if (lines[i].includes("@" + tagName)) {
                      const zoneEnd = Math.min(lines.length - 1, i + ZONE_LINES);
                      for (let j = i; j <= zoneEnd; j++) {
                        if (j > i && lines[j].includes("@") && !lines[j].includes("@" + tagName))
                          break;
                        priorityLineSet.add(j);
                      }
                    }
                  }
                }
              }
              for (let i = 0; i < lines.length; i++) {
                const inPriority = priorityLineSet.has(i);
                const isMatch = q.length >= 2 ? lines[i].toLowerCase().includes(q) : inPriority;
                if (isMatch) {
                  results.push({
                    skill: skill.name,
                    file: filePath,
                    line: i + 1,
                    context: lines.slice(Math.max(0, i - 1), i + 2).join("\n"),
                    match: lines[i].trim(),
                    priority: activeFlags.length > 0 && inPriority
                  });
                  if (results.length >= collectLimit)
                    break;
                }
              }
              if (results.length >= collectLimit)
                break;
            }
            if (results.length >= collectLimit)
              break;
          }
          if (activeFlags.length > 0) {
            results.sort((a, b) => (b.priority ? 1 : 0) - (a.priority ? 1 : 0));
          }
          return results.slice(0, 50);
        }
        function buildFileTree(files) {
          const tree = [];
          const dirs = {};
          for (const filePath of Object.keys(files)) {
            if (filePath === "SKILL.md")
              continue;
            const parts = filePath.split("/");
            if (parts.length === 1) {
              tree.push({ type: "file", name: parts[0], path: filePath, ext: getExt(filePath) });
            } else {
              const topDir = parts[0];
              if (!dirs[topDir]) {
                dirs[topDir] = { type: "dir", name: topDir, path: topDir, children: [] };
                tree.push(dirs[topDir]);
              }
              dirs[topDir].children.push({
                type: "file",
                name: parts.slice(1).join("/"),
                path: filePath,
                ext: getExt(filePath)
              });
            }
          }
          tree.sort((a, b) => {
            if (a.type !== b.type)
              return a.type === "dir" ? -1 : 1;
            return a.name.localeCompare(b.name);
          });
          return tree;
        }
        function countFiles(nodes) {
          return nodes.reduce((n, node) => n + (node.type === "file" ? 1 : countFiles(node.children || [])), 0);
        }
        class FlowDocsInstance {
          constructor(options2) {
            this.container = typeof options2.container === "string" ? document.querySelector(options2.container) : options2.container;
            if (!this.container)
              throw new Error("FlowDocs: container not found");
            this.onSave = options2.onSave || null;
            this.data = null;
            this.markedInstance = createMarked();
            this.currentSkill = null;
            this.currentFilePath = null;
            this.currentRawContent = "";
            this.editorMode = false;
            this.searchTimeout = null;
            this._injectCSS();
            this._buildDOM();
            this._bindEvents();
            if (options2.dataUrl) {
              this.loadFromUrl(options2.dataUrl);
            } else if (options2.data) {
              this.loadData(options2.data);
            }
          }
          // ─── CSS injection ─────────────────────────────────────────────────────
          _injectCSS() {
            if (!document.querySelector('link[href*="highlight.js"][href*="github-dark"]')) {
              const link = document.createElement("link");
              link.rel = "stylesheet";
              link.href = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css";
              document.head.appendChild(link);
            }
            const style = document.createElement("style");
            style.textContent = style_default;
            document.head.appendChild(style);
            this._loadHljs();
          }
          _loadHljs() {
            if (window.hljs)
              return Promise.resolve();
            return new Promise((resolve) => {
              if (document.querySelector('script[src*="highlight.min.js"]')) {
                const check = () => window.hljs ? resolve() : setTimeout(check, 50);
                check();
                return;
              }
              const s = document.createElement("script");
              s.src = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js";
              s.onload = () => {
                const langs = ["vbnet", "sql"];
                let loaded = 0;
                langs.forEach((lang) => {
                  const ls = document.createElement("script");
                  ls.src = `https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/${lang}.min.js`;
                  ls.onload = () => {
                    if (++loaded === langs.length)
                      resolve();
                  };
                  document.head.appendChild(ls);
                });
              };
              document.head.appendChild(s);
            });
          }
          // ─── DOM structure ─────────────────────────────────────────────────────
          _buildDOM() {
            this.container.innerHTML = "";
            const root = document.createElement("div");
            root.className = "flow-docs-root";
            root.innerHTML = `
        <!-- Sidebar -->
        <aside class="fd-sidebar">
          <div class="fd-sidebar-header">
            <div class="fd-logo">
              ${ICONS.book}
              <span>Flow-Docs</span>
            </div>
            <div class="fd-search-box">
              ${ICONS.search}
              <input type="text" class="fd-search-input" placeholder="Buscar... (usa --flag para filtrar)" autocomplete="off">
              <kbd>Ctrl+K</kbd>
              <div class="fd-flag-suggestions fd-hidden"></div>
            </div>
            <div class="fd-search-flags fd-hidden"></div>
          </div>
          <nav class="fd-skill-list"></nav>
        </aside>

        <!-- Main content -->
        <main class="fd-main">
          <div class="fd-content-area">
            <!-- Editor toolbar -->
            <div class="fd-editor-toolbar fd-hidden">
              <label class="fd-editor-switch" title="Activar modo editor">
                <input type="checkbox" class="fd-editor-toggle">
                <span class="fd-switch-track"><span class="fd-switch-thumb"></span></span>
                <span class="fd-switch-label">Editor</span>
              </label>
              <button class="fd-btn-save fd-hidden">
                ${ICONS.save} Guardar
              </button>
            </div>

            <div class="fd-welcome">
              <div class="fd-welcome-inner">
                ${ICONS.book}
                <h1>Flow-Docs</h1>
                <p>Selecciona un skill del sidebar para ver su documentaci\xF3n.</p>
                <p class="fd-hint">Usa <kbd>Ctrl+K</kbd> para buscar en todos los skills.</p>
              </div>
            </div>
            <div class="fd-skill-content fd-hidden"></div>
            <div class="fd-editor-area fd-hidden">
              <textarea class="fd-editor-textarea" spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off"></textarea>
            </div>
            <div class="fd-search-results fd-hidden"></div>
          </div>

          <!-- TOC -->
          <div class="fd-toc">
            <div class="fd-toc-resizer"></div>
            <div class="fd-toc-title">En esta p\xE1gina</div>
            <ul class="fd-toc-list"></ul>
          </div>
        </main>

        <!-- Toast -->
        <div class="fd-toast">
          ${ICONS.check}
          <span class="fd-toast-msg">Copiado</span>
        </div>
      `;
            this.container.appendChild(root);
            this.root = root;
            this.$ = {
              skillList: root.querySelector(".fd-skill-list"),
              searchInput: root.querySelector(".fd-search-input"),
              flagSuggestions: root.querySelector(".fd-flag-suggestions"),
              searchFlags: root.querySelector(".fd-search-flags"),
              welcome: root.querySelector(".fd-welcome"),
              skillContent: root.querySelector(".fd-skill-content"),
              searchResults: root.querySelector(".fd-search-results"),
              editorToolbar: root.querySelector(".fd-editor-toolbar"),
              editorToggle: root.querySelector(".fd-editor-toggle"),
              editorArea: root.querySelector(".fd-editor-area"),
              editorTextarea: root.querySelector(".fd-editor-textarea"),
              btnSave: root.querySelector(".fd-btn-save"),
              toc: root.querySelector(".fd-toc"),
              tocList: root.querySelector(".fd-toc-list"),
              tocResizer: root.querySelector(".fd-toc-resizer"),
              contentArea: root.querySelector(".fd-content-area"),
              toast: root.querySelector(".fd-toast"),
              toastMsg: root.querySelector(".fd-toast-msg"),
              main: root.querySelector(".fd-main")
            };
          }
          // ─── Event binding ─────────────────────────────────────────────────────
          _bindEvents() {
            this.$.searchInput.addEventListener("input", () => {
              clearTimeout(this.searchTimeout);
              const raw = this.$.searchInput.value.trim();
              const { flags, query } = this._parseSearchQuery(raw);
              this._updateFlagChips(flags);
              this._showFlagSuggestions();
              const hasSearch = query.length >= 2 || flags.length > 0;
              if (!hasSearch) {
                if (this.currentSkill)
                  this._loadSkill(this.currentSkill);
                else
                  this._showPanel("welcome");
                return;
              }
              this.searchTimeout = setTimeout(() => this._doSearch(raw), 250);
            });
            this.$.searchInput.addEventListener("blur", () => {
              setTimeout(() => this._hideFlagSuggestions(), 150);
            });
            this.root.addEventListener("keydown", (e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                e.preventDefault();
                this.$.searchInput.focus();
                this.$.searchInput.select();
              }
              if (e.key === "Escape") {
                if (document.activeElement === this.$.searchInput) {
                  this.$.searchInput.value = "";
                  this.$.searchInput.blur();
                  if (this.currentSkill)
                    this._loadSkill(this.currentSkill);
                  else
                    this._showPanel("welcome");
                }
              }
            });
            this.root.setAttribute("tabindex", "-1");
            this.$.skillList.addEventListener("click", (e) => {
              const header = e.target.closest(".fd-tree-dir-header");
              if (header) {
                e.stopPropagation();
                const children = header.nextElementSibling;
                const chevron = header.querySelector(".fd-tree-chevron");
                const open = header.dataset.open === "true";
                header.dataset.open = !open;
                children.classList.toggle("fd-hidden", open);
                if (chevron)
                  chevron.style.transform = open ? "" : "rotate(90deg)";
                return;
              }
              const fileEl = e.target.closest(".fd-tree-file");
              if (fileEl) {
                e.stopPropagation();
                this._loadFile(fileEl.dataset.skill, fileEl.dataset.path);
              }
            });
            this.$.editorToggle.addEventListener("change", (e) => {
              this._toggleEditorMode(e.target.checked);
            });
            this.$.btnSave.addEventListener("click", () => this._saveFile());
            this.$.editorTextarea.addEventListener("keydown", (e) => {
              if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "Enter")) {
                e.preventDefault();
                this._saveFile();
              }
            });
            this.root.addEventListener("click", (e) => {
              const btn = e.target.closest(".fd-btn-copy");
              if (btn) {
                const code = btn.closest(".fd-code-block").querySelector("code");
                navigator.clipboard.writeText(code.innerText).then(() => this._showToast());
              }
            });
            this._initTocResizer();
          }
          // ─── Data loading ──────────────────────────────────────────────────────
          async loadFromUrl(url) {
            const res = await fetch(url);
            const data = await res.json();
            this.loadData(data);
          }
          loadData(data) {
            this.data = data;
            this._renderSkillList();
          }
          reload(data) {
            if (data)
              this.data = data;
            this._renderSkillList();
            if (this.currentSkill) {
              this._loadSkill(this.currentSkill);
            }
          }
          // ─── Skill list ────────────────────────────────────────────────────────
          _renderSkillList() {
            if (!this.data || !this.data.skills.length) {
              this.$.skillList.innerHTML = `<div class="fd-empty-state">No se encontraron skills.</div>`;
              return;
            }
            this.$.skillList.innerHTML = this.data.skills.map((s) => `
        <div class="fd-skill-item ${this.currentSkill === s.name ? "active" : ""}"
             data-skill="${escAttr(s.name)}">
          <div class="fd-skill-name">
            ${ICONS.code}
            ${escHtml(s.name)}
          </div>
          ${s.description ? `<div class="fd-skill-desc">${escHtml(s.description)}</div>` : ""}
        </div>
      `).join("");
            this.$.skillList.querySelectorAll(".fd-skill-item").forEach((el) => {
              el.addEventListener("click", () => this._loadSkill(el.dataset.skill));
            });
          }
          // ─── Load skill ────────────────────────────────────────────────────────
          _loadSkill(name, section) {
            const skill = this.data.skills.find((s) => s.name === name);
            if (!skill || !skill.files["SKILL.md"])
              return;
            this.currentSkill = name;
            this.root.querySelectorAll(".fd-skill-item").forEach((el) => {
              el.classList.toggle("active", el.dataset.skill === name);
            });
            this.root.querySelectorAll(".fd-tree-file").forEach((el) => el.classList.remove("active"));
            this.$.toc.classList.add("visible");
            if (this.editorMode) {
              this.$.editorToggle.checked = false;
              this._toggleEditorMode(false);
            }
            this.currentFilePath = null;
            const rawContent = skill.files["SKILL.md"];
            this.currentRawContent = rawContent;
            let content = resolveFileRefs(rawContent, skill.files);
            content = addHeadingIds(content);
            const html = this.markedInstance.parse(content);
            const sections = extractSections(rawContent);
            this._showPanel("skillContent");
            this.$.skillContent.innerHTML = html;
            this._highlightCode();
            this._buildTOC(sections, name);
            if (section) {
              setTimeout(() => {
                const el = this.root.querySelector(`#${section}`) || this.root.querySelector(`[id="${section}"]`);
                if (el)
                  el.scrollIntoView({ behavior: "smooth", block: "start" });
              }, 100);
            } else {
              this.$.contentArea.scrollTop = 0;
            }
            this._buildSkillTree(skill);
          }
          // ─── Load file ─────────────────────────────────────────────────────────
          _loadFile(skillName, filePath) {
            const skill = this.data.skills.find((s) => s.name === skillName);
            if (!skill)
              return;
            const fileContent = skill.files[filePath];
            if (fileContent === void 0)
              return;
            this.currentSkill = skillName;
            this.currentFilePath = filePath;
            this.currentRawContent = fileContent;
            this.root.querySelectorAll(".fd-skill-item").forEach((el) => {
              el.classList.toggle("active", el.dataset.skill === skillName);
            });
            this.root.querySelectorAll(".fd-tree-file").forEach((el) => {
              el.classList.toggle("active", el.dataset.skill === skillName && el.dataset.path === filePath);
            });
            if (this.editorMode) {
              this.$.editorToggle.checked = false;
              this._toggleEditorMode(false);
            }
            this._showPanel("skillContent");
            const ext = getExt(filePath);
            if (ext === "md") {
              let mdContent = addHeadingIds(fileContent);
              const html = this.markedInstance.parse(mdContent);
              const sections = extractSections(fileContent);
              this.$.skillContent.innerHTML = html;
              this._highlightCode();
              this._buildTOC(sections, skillName);
              this.$.toc.classList.add("visible");
            } else {
              const lang = ext || "plaintext";
              const escaped = escHtml(fileContent);
              this.$.skillContent.innerHTML = `
          <div class="fd-file-header">
            <span class="fd-file-breadcrumb">${escHtml(skillName)} / ${escHtml(filePath)}</span>
          </div>
          <div class="fd-code-block">
            <div class="fd-code-header">
              <span class="fd-code-lang">${escHtml(lang)}</span>
              <button class="fd-btn-copy" title="Copiar c\xF3digo">
                ${ICONS.copy} Copiar
              </button>
            </div>
            <pre><code class="hljs language-${escHtml(lang)}">${escaped}</code></pre>
          </div>`;
              this._highlightCode();
              this.$.tocList.innerHTML = "";
              this.$.toc.classList.remove("visible");
            }
            this.$.contentArea.scrollTop = 0;
          }
          // ─── File tree ─────────────────────────────────────────────────────────
          _buildSkillTree(skill) {
            this.root.querySelectorAll(".fd-skill-tree").forEach((el) => el.remove());
            const tree = buildFileTree(skill.files);
            if (!tree.length)
              return;
            const skillItem = this.root.querySelector(`.fd-skill-item[data-skill="${escAttr(skill.name)}"]`);
            if (!skillItem)
              return;
            const treeEl = document.createElement("div");
            treeEl.className = "fd-skill-tree";
            treeEl.dataset.skill = skill.name;
            treeEl.innerHTML = this._renderTreeNodes(tree, skill.name);
            skillItem.insertAdjacentElement("afterend", treeEl);
          }
          _renderTreeNodes(nodes, skillName) {
            return nodes.map((node) => {
              if (node.type === "dir") {
                const hasFiles = (node.children || []).length > 0;
                return `
            <div class="fd-tree-dir">
              <div class="fd-tree-dir-header" data-open="false">
                ${ICONS.chevron}
                ${ICONS.folder}
                <span>${escHtml(node.name)}</span>
                ${hasFiles ? `<span class="fd-tree-count">${countFiles(node.children)}</span>` : ""}
              </div>
              <div class="fd-tree-dir-children fd-hidden">
                ${this._renderTreeNodes(node.children || [], skillName)}
              </div>
            </div>`;
              } else {
                const iconKey = FILE_ICONS[node.ext] || "fileMd";
                return `
            <div class="fd-tree-file" data-skill="${escAttr(skillName)}" data-path="${escAttr(node.path)}" title="${escAttr(node.path)}">
              ${ICONS[iconKey]}
              <span>${escHtml(node.name)}</span>
            </div>`;
              }
            }).join("");
          }
          // ─── TOC ───────────────────────────────────────────────────────────────
          _buildTOC(sections, skillName) {
            this.$.tocList.innerHTML = sections.map((s) => `
        <li class="fd-toc-level-${s.level}">
          <a href="javascript:void(0)" data-section="${escAttr(s.id)}">${escHtml(s.title)}</a>
        </li>
      `).join("");
            this.$.tocList.querySelectorAll("a").forEach((a) => {
              a.addEventListener("click", (e) => {
                e.preventDefault();
                const id = a.dataset.section;
                const el = this.root.querySelector(`#${id}`) || this.root.querySelector(`[id="${id}"]`);
                if (el)
                  el.scrollIntoView({ behavior: "smooth", block: "start" });
              });
            });
          }
          // ─── Search ────────────────────────────────────────────────────────────
          _parseSearchQuery(raw) {
            const tokens = raw.trim().split(/\s+/).filter(Boolean);
            const flags = tokens.filter((t) => t.startsWith("--") && t.length > 2);
            const query = tokens.filter((t) => !t.startsWith("--")).join(" ").trim();
            return { flags, query };
          }
          _updateFlagChips(activeFlags) {
            const container = this.$.searchFlags;
            if (!activeFlags.length) {
              container.classList.add("fd-hidden");
              container.innerHTML = "";
              return;
            }
            container.classList.remove("fd-hidden");
            const allFlags = this.data && this.data.flags || [];
            container.innerHTML = activeFlags.map((flag) => {
              const def = allFlags.find((f) => f.flag === flag);
              return `<span class="fd-flag-chip">${escHtml(def ? def.label : flag)}</span>`;
            }).join("");
          }
          _showFlagSuggestions() {
            const inputEl = this.$.searchInput;
            const val = inputEl.value;
            const cursorPos = inputEl.selectionStart;
            const textBeforeCursor = val.slice(0, cursorPos);
            const lastSpaceIdx = textBeforeCursor.lastIndexOf(" ");
            const currentWord = textBeforeCursor.slice(lastSpaceIdx + 1);
            if (!currentWord.startsWith("--") || currentWord.length < 2 || !this.data) {
              this._hideFlagSuggestions();
              return;
            }
            const matches = (this.data.flags || []).filter((f) => f.flag.startsWith(currentWord) && f.flag !== currentWord);
            if (!matches.length) {
              this._hideFlagSuggestions();
              return;
            }
            const dropdown = this.$.flagSuggestions;
            dropdown.innerHTML = matches.map((f) => `
        <div class="fd-flag-suggestion" data-flag="${escAttr(f.flag)}">
          <code>${escHtml(f.flag)}</code>
          <span>${escHtml(f.label)}</span>
        </div>
      `).join("");
            dropdown.classList.remove("fd-hidden");
            dropdown.querySelectorAll(".fd-flag-suggestion").forEach((el) => {
              el.addEventListener("mousedown", (ev) => {
                ev.preventDefault();
                const flag = el.dataset.flag;
                const before = val.slice(0, lastSpaceIdx + 1);
                const after = val.slice(cursorPos).trimStart();
                inputEl.value = (before + flag + " " + after).trimStart();
                inputEl.dispatchEvent(new Event("input"));
                inputEl.focus();
                this._hideFlagSuggestions();
              });
            });
          }
          _hideFlagSuggestions() {
            this.$.flagSuggestions.classList.add("fd-hidden");
          }
          _doSearch(rawQuery) {
            const { flags, query } = this._parseSearchQuery(rawQuery);
            if (query.length < 2 && !flags.length)
              return;
            const results = searchSkills(this.data, query, flags);
            this._showPanel("searchResults");
            this._hideFlagSuggestions();
            const allFlags = this.data && this.data.flags || [];
            const flagBadges = flags.map((f) => {
              const def = allFlags.find((af) => af.flag === f);
              return `<span class="fd-flag-chip">${escHtml(def ? def.label : f)}</span>`;
            }).join("");
            if (results.length === 0) {
              this.$.searchResults.innerHTML = `<div class="fd-search-empty">Sin resultados para "<strong>${escHtml(query)}</strong>"${flagBadges ? `<span class="fd-search-filter-badges">${flagBadges}</span>` : ""}</div>`;
              return;
            }
            const highlighted = (text) => {
              if (!query)
                return escHtml(text);
              const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
              return escHtml(text).replace(re, "<mark>$1</mark>");
            };
            const renderResult = (r) => `
        <div class="fd-search-result${r.priority ? " priority" : ""}" data-skill="${escAttr(r.skill)}" data-file="${escAttr(r.file)}">
          <div class="fd-search-result-meta">
            <span class="fd-tag">${escHtml(r.skill)}</span>
            <span class="fd-file-path">${escHtml(r.file)}:${r.line}</span>
            ${r.priority ? `<span class="fd-priority-badge">\u2605 destacado</span>` : ""}
          </div>
          <div class="fd-search-result-match">${highlighted(r.match)}</div>
          <div class="fd-search-result-context">${highlighted(r.context)}</div>
        </div>`;
            const priorityResults = results.filter((r) => r.priority);
            const normalResults = results.filter((r) => !r.priority);
            let resultsHtml = priorityResults.map(renderResult).join("");
            if (priorityResults.length > 0 && normalResults.length > 0) {
              resultsHtml += `<div class="fd-search-divider">Otros resultados</div>`;
            }
            resultsHtml += normalResults.map(renderResult).join("");
            this.$.searchResults.innerHTML = `
        <div class="fd-search-header">
          ${results.length} resultado${results.length !== 1 ? "s" : ""} para "<strong>${escHtml(query)}</strong>"
          ${flagBadges ? `<span class="fd-search-filter-badges">${flagBadges}</span>` : ""}
        </div>
        ${resultsHtml}
      `;
            this.$.searchResults.querySelectorAll(".fd-search-result").forEach((el) => {
              el.addEventListener("click", () => {
                this.$.searchInput.value = "";
                this._updateFlagChips([]);
                this._loadFile(el.dataset.skill, el.dataset.file);
              });
            });
            this.$.toc.classList.remove("visible");
          }
          // ─── Editor ────────────────────────────────────────────────────────────
          _toggleEditorMode(active) {
            this.editorMode = active;
            if (active) {
              this.$.editorTextarea.value = this.currentRawContent;
              this.$.skillContent.classList.add("fd-hidden");
              this.$.editorArea.classList.remove("fd-hidden");
              this.$.btnSave.classList.remove("fd-hidden");
              this.$.contentArea.classList.add("editor-mode-active");
              this.$.editorTextarea.focus();
            } else {
              this.$.editorArea.classList.add("fd-hidden");
              this.$.skillContent.classList.remove("fd-hidden");
              this.$.btnSave.classList.add("fd-hidden");
              this.$.contentArea.classList.remove("editor-mode-active");
            }
          }
          async _saveFile() {
            if (!this.currentSkill)
              return;
            const content = this.$.editorTextarea.value;
            const filePath = this.currentFilePath || "SKILL.md";
            const btn = this.$.btnSave;
            btn.disabled = true;
            try {
              const skill = this.data.skills.find((s) => s.name === this.currentSkill);
              if (skill) {
                skill.files[filePath] = content;
                if (filePath === "SKILL.md") {
                  const lines = content.split("\n").slice(0, 5);
                  for (const line of lines) {
                    const m = line.match(/^#\s+(.+)/);
                    if (m) {
                      skill.description = m[1].trim();
                      break;
                    }
                  }
                }
              }
              this.currentRawContent = content;
              this.$.editorToggle.checked = false;
              this._toggleEditorMode(false);
              if (this.currentFilePath) {
                this._loadFile(this.currentSkill, this.currentFilePath);
              } else {
                this._loadSkill(this.currentSkill);
              }
              if (this.onSave) {
                await this.onSave(this.currentSkill, filePath, content);
              }
              this._showToast("Guardado");
            } catch (e) {
              this._showToast("Error: " + e.message);
            } finally {
              btn.disabled = false;
            }
          }
          // ─── UI helpers ────────────────────────────────────────────────────────
          _showPanel(id) {
            const panels = { welcome: this.$.welcome, skillContent: this.$.skillContent, searchResults: this.$.searchResults };
            for (const [key, el] of Object.entries(panels)) {
              el.classList.toggle("fd-hidden", key !== id);
            }
            this.$.editorArea.classList.add("fd-hidden");
            this.$.editorToolbar.classList.toggle("fd-hidden", id !== "skillContent");
          }
          _showToast(msg) {
            this.$.toastMsg.textContent = msg || "Copiado";
            this.$.toast.classList.add("show");
            setTimeout(() => this.$.toast.classList.remove("show"), 1800);
          }
          _highlightCode() {
            if (!window.hljs)
              return;
            this.root.querySelectorAll("pre code").forEach((el) => {
              window.hljs.highlightElement(el);
            });
          }
          _initTocResizer() {
            const resizer = this.$.tocResizer;
            const toc = this.$.toc;
            const savedW = parseInt(localStorage.getItem("flow-docs-toc-width"));
            if (savedW && savedW >= 100 && savedW <= 600) {
              this.root.style.setProperty("--fd-toc-w", savedW + "px");
            }
            resizer.addEventListener("mousedown", (e) => {
              e.preventDefault();
              const startX = e.clientX;
              const startW = toc.offsetWidth;
              let currentW = startW;
              resizer.classList.add("dragging");
              document.body.style.cursor = "col-resize";
              document.body.style.userSelect = "none";
              const onMove = (e2) => {
                currentW = Math.max(100, Math.min(600, startW + (startX - e2.clientX)));
                this.root.style.setProperty("--fd-toc-w", currentW + "px");
              };
              const onUp = () => {
                resizer.classList.remove("dragging");
                document.body.style.cursor = "";
                document.body.style.userSelect = "";
                localStorage.setItem("flow-docs-toc-width", currentW);
                document.removeEventListener("mousemove", onMove);
                document.removeEventListener("mouseup", onUp);
              };
              document.addEventListener("mousemove", onMove);
              document.addEventListener("mouseup", onUp);
            });
          }
        }
        const FlowDocs = {
          init(options2) {
            return new FlowDocsInstance(options2);
          }
        };
        if (typeof module !== "undefined" && module.exports) {
          module.exports = FlowDocs;
        }
        window.FlowDocs = FlowDocs;
      })();
    }
  });
  return require_flow_docs();
})();
