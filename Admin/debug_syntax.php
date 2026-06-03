<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

$file = __DIR__ . '/admin/view_client.php';

if (!file_exists($file)) {
    die("File not found: $file");
}

$code = file_get_contents($file);

// Simple syntax check helper using tokenizer
$tokens = token_get_all($code);
$balance = 0;
$line = 0;

foreach ($tokens as $token) {
    if (is_array($token)) {
        $line = $token[2];
        // Check for unbalanced braces (not perfect but finds simple errors)
    } else {
        if ($token == '{') $balance++;
        if ($token == '}') $balance--;
    }
}

if ($balance != 0) {
    echo "<h1>POSSIBLE SYNTAX ERROR</h1>";
    echo "Found unbalanced braces. Balance: $balance (Should be 0).<br>";
    echo "If balance is positive, you are missing a '}'.<br>";
    echo "If balance is negative, you have too many '}'.<br>";
} else {
    echo "<h1>Brace check passed.</h1>";
}

// Try to include it to trigger parse error
echo "<h2>Attempting to include file...</h2>";
try {
    include $file;
    echo "<br><strong>Include successful! Script ran without parse error.</strong>";
} catch (Throwable $e) {
    echo "<br><strong style='color:red'>Fatal Error: " . $e->getMessage() . " on line " . $e->getLine() . "</strong>";
} catch (Exception $e) {
    echo "<br><strong style='color:red'>Exception: " . $e->getMessage() . "</strong>";
}
?>
