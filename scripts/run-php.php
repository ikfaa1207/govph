<?php

$php85 = 'C:/Users/Admin/AppData/Local/Microsoft/WinGet/Packages/PHP.PHP.8.5_Microsoft.Winget.Source_8wekyb3d8bbwe/php.exe';

if (PHP_VERSION_ID < 80400 && file_exists($php85)) {
    $binary = escapeshellarg($php85);
} else {
    $binary = 'php';
}

$args = array_slice($argv, 1);
$cmd = $binary.' '.implode(' ', array_map('escapeshellarg', $args));

passthru($cmd, $exitCode);
exit($exitCode);
