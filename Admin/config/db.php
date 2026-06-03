<?php
// config/db.php

$host = 'localhost';
$db_name = 'u406992830_tds';
$username = 'u406992830_tds'; // Update with your DB username
$password = 'Noufal@2025'; // Update with your DB password

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db_name;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    die("Connection failed: " . $e->getMessage());
}
?>
