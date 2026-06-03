<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gallery Access - WhiteTake</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body { background: #f0f2f5; display: flex; align-items: center; justify-content: center; height: 100vh; }
        .lock-card { background: white; padding: 40px; border-radius: 20px; text-align: center; max-width: 400px; width: 90%; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
    </style>
</head>
<body>
    <div class="lock-card">
        <div class="mb-4">
            <svg width="64" height="64" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" color="#000"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
        </div>
        <h3 class="mb-2">Private Gallery</h3>
        <p class="text-muted mb-4">Please enter your access code to view photos.</p>
        
        <?php if (!empty($error)): ?>
            <div class="alert alert-danger py-2 mb-3"><?php echo htmlspecialchars($error); ?></div>
        <?php endif; ?>

        <form method="POST">
            <div class="mb-3">
                <input type="text" name="access_code" class="form-control form-control-lg text-center letter-spacing-2" placeholder="CODE" required style="letter-spacing: 3px; font-weight: bold; text-transform: uppercase;">
            </div>
            <button type="submit" class="btn btn-dark w-100 py-2">Unlock Gallery</button>
        </form>
    </div>
</body>
</html>
