{{- /* Markdown version of an article (index.md next to index.html), for AI agents
     and anyone who wants the plain text. Older articles were imported as HTML,
     so outside code fences the common tags are turned back into Markdown. */ -}}
{{- $parts := split .RawContent "```" -}}
{{- $body := slice -}}
{{- range $i, $p := $parts -}}
  {{- if modBool $i 2 -}}
    {{- $p = $p | replaceRE `<h2[^>]*>(.*?)</h2>` "\n## $1\n" | replaceRE `<h3[^>]*>(.*?)</h3>` "\n### $1\n" | replaceRE `<h4[^>]*>(.*?)</h4>` "\n#### $1\n" -}}
    {{- $p = $p | replaceRE `<img src="([^"]*)" alt="([^"]*)"[^>]*>` (printf "![$2](%s$1)" (strings.TrimSuffix "/" site.BaseURL)) -}}
    {{- $p = $p | replaceRE `<a [^>]*href="([^"]*)"[^>]*>(.*?)</a>` "[$2]($1)" -}}
    {{- $p = $p | replaceRE `</?strong>` "**" | replaceRE `</?em>` "*" | replaceRE `</?code>` "`" -}}
    {{- $p = $p | replaceRE `<li>(<p>)?` "- " | replaceRE `(</p>)?</li>` "" | replaceRE `</?(ul|ol)[^>]*>` "" -}}
    {{- $p = $p | replaceRE `<blockquote>\s*<p>` "> " | replaceRE `</?blockquote>` "" -}}
    {{- $p = $p | replaceRE `<br\s*/?>` "\n" | replaceRE `<p>` "" | replaceRE `</p>` "\n" -}}
    {{- $p = $p | htmlUnescape | replaceRE `\n{3,}` "\n\n" -}}
  {{- end -}}
  {{- $body = $body | append $p -}}
{{- end -}}
# {{ .Title | replaceRE "\n" " " }}

{{ with .Description }}> {{ . }}

{{ end -}}
- Author: Luiz Schons
- Published: {{ .Date.Format "2006-01-02" }}
- URL: {{ .Permalink }}
{{- range .Translations }}
- {{ .Language.LanguageName }}: {{ with .OutputFormats.Get "markdown" }}{{ .Permalink }}{{ end }}
{{- end }}
{{- with .GetTerms "tags" }}
- {{ i18n "tags" }}: {{ range $i, $t := . }}{{ if $i }}, {{ end }}{{ $t.LinkTitle }}{{ end }}
{{- end }}

{{ delimit $body "```" | strings.TrimSpace }}
