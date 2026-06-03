<?php
// auth.php - Authentication Helper
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

function check_auth() {
    if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
        header("Location: login.php");
        exit;
    }
}
?>
