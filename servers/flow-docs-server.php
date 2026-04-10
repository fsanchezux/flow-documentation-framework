<?php
/**
 * FlowDocs server adapter for PHP.
 *
 * Drop this file into your project and configure $DOCS_FOLDER.
 *
 * Usage in HTML:
 *   FlowDocs.init({
 *     container: '#docs',
 *     apiUrl: '/flow-docs-server.php'
 *   })
 *
 * Endpoints:
 *   GET  /flow-docs-server.php              → returns full JSON data
 *   POST /flow-docs-server.php?action=save  → saves a file (body: {skill, file, content})
 */

// ━━━ CONFIGURE THIS: path to your documentation folder ━━━━━━━━━━━━━━━━━━
$DOCS_FOLDER = __DIR__ . '/docs';
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

$TEXT_EXTS = [
    '.md', '.txt', '.vb', '.js', '.ts', '.html', '.css', '.sql',
    '.cs', '.json', '.xml', '.yaml', '.yml', '.config', '.php',
    '.py', '.rb', '.go', '.java', '.sh', '.bat'
];

$SEARCH_FLAGS = [
    ['flag' => '--ejemplo', 'label' => 'Ejemplos',    'dirs' => null,           'exts' => ['.vb', '.js', '.html', '.cs']],
    ['flag' => '--ref',     'label' => 'Referencias', 'dirs' => ['references'], 'exts' => null],
    ['flag' => '--lib',     'label' => 'Librerías',   'dirs' => ['libraries'],  'exts' => null],
    ['flag' => '--style',   'label' => 'Estilos',     'dirs' => ['style'],      'exts' => ['.css']],
    ['flag' => '--script',  'label' => 'Scripts',     'dirs' => ['scripts'],    'exts' => ['.js']],
    ['flag' => '--sql',     'label' => 'SQL',         'dirs' => null,           'exts' => ['.sql']],
    ['flag' => '--doc',     'label' => 'Docs',        'dirs' => null,           'exts' => ['.md']],
    ['flag' => '--vb',      'label' => 'VB.NET',      'dirs' => null,           'exts' => ['.vb']],
];

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

function readFilesRecursive($baseDir, $currentDir, &$files, $textExts) {
    $entries = scandir($currentDir);
    foreach ($entries as $entry) {
        if ($entry[0] === '.') continue;
        $fullPath = $currentDir . DIRECTORY_SEPARATOR . $entry;

        if (is_dir($fullPath)) {
            readFilesRecursive($baseDir, $fullPath, $files, $textExts);
        } else {
            $ext = strtolower(pathinfo($entry, PATHINFO_EXTENSION));
            if (!in_array('.' . $ext, $textExts)) continue;
            $relPath = str_replace('\\', '/', substr($fullPath, strlen($baseDir) + 1));
            $files[$relPath] = file_get_contents($fullPath);
        }
    }
}

function extractDescription($content) {
    $lines = explode("\n", $content);
    for ($i = 0; $i < min(5, count($lines)); $i++) {
        if (preg_match('/^#\s+(.+)/', $lines[$i], $m)) {
            return trim($m[1]);
        }
    }
    return '';
}

try {
    $action = isset($_GET['action']) ? $_GET['action'] : '';

    if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'save') {
        // ─── Save file ───────────────────────────────────────────────
        $input = json_decode(file_get_contents('php://input'), true);
        $skill = $input['skill'] ?? '';
        $file  = $input['file'] ?? '';
        $content = $input['content'] ?? '';

        if (strpos($skill, '..') !== false || strpos($file, '..') !== false) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid path']);
            exit;
        }

        $fullPath = realpath($DOCS_FOLDER) . DIRECTORY_SEPARATOR .
                    str_replace('/', DIRECTORY_SEPARATOR, $skill . '/' . $file);

        if (strpos(realpath(dirname($fullPath)), realpath($DOCS_FOLDER)) !== 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Path traversal detected']);
            exit;
        }

        file_put_contents($fullPath, $content);
        echo json_encode(['success' => true]);

    } else {
        // ─── Get data ────────────────────────────────────────────────
        $skills = [];
        $docsPath = realpath($DOCS_FOLDER);

        if ($docsPath && is_dir($docsPath)) {
            $dirs = scandir($docsPath);
            foreach ($dirs as $dir) {
                if ($dir[0] === '.') continue;
                $skillDir = $docsPath . DIRECTORY_SEPARATOR . $dir;
                if (!is_dir($skillDir)) continue;
                if (!file_exists($skillDir . DIRECTORY_SEPARATOR . 'SKILL.md')) continue;

                $files = [];
                readFilesRecursive($skillDir, $skillDir, $files, $TEXT_EXTS);

                $description = isset($files['SKILL.md'])
                    ? extractDescription($files['SKILL.md'])
                    : '';

                $skills[] = [
                    'name' => $dir,
                    'description' => $description,
                    'files' => (object)$files
                ];
            }

            usort($skills, function($a, $b) {
                return strcmp($a['name'], $b['name']);
            });
        }

        echo json_encode([
            'version' => 1,
            'generatedAt' => gmdate('Y-m-d\TH:i:s\Z'),
            'skills' => $skills,
            'flags' => $SEARCH_FLAGS
        ]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
