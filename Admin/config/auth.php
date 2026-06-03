<?php
// config/auth.php
session_start();

function isLoggedIn() {
    return isset($_SESSION['user_id']);
}

function isAdmin() {
    return isset($_SESSION['role']) && $_SESSION['role'] === 'admin';
}

function requireLogin() {
    if (!isLoggedIn()) {
        header("Location: ../client/login.php");
        exit;
    }
}

function requireAdmin() {
    if (!isAdmin()) {
        header("Location: ../admin/login.php");
        exit;
    }
}

function requireClient() {
    if (!isLoggedIn() || (isset($_SESSION['role']) && $_SESSION['role'] !== 'client')) {
        header("Location: login.php");
        exit;
    }
}

function logout() {
    session_destroy();
    header("Location: login.php");
    exit;
}
?>
