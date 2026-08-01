with open('contact.html', 'r', encoding='utf-8') as f:
    html = f.read()

old_style = """<style>
/* Custom Contact Styles - Matching Site Theme (Black & White) */
.contact-hero { padding: 120px 0 60px; text-align: center; position: relative; background: #000; overflow: hidden; }
.contact-hero::before { content:''; position:absolute; top:-100px; right:0; width:500px; height:500px; background: rgba(255,255,255,0.03); border-radius:50%; filter: blur(60px); pointer-events:none; }
.hero-tag { display: inline-flex; align-items: center; gap: 15px; margin-bottom: 20px; }
.hero-tag .line { height: 1px; width: 40px; background: #ffffff; }
.hero-tag span { color: #aaaaaa; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; font-weight: 600; }
.contact-hero h1 { font-size: 56px; font-weight: 900; color: #fff; margin-bottom: 20px; font-family: 'Cormorant Garamond', serif; }
.contact-hero h1 .gold-italic { font-style: italic; color: #ffffff; font-weight: 400; }
.contact-hero p { color: #888; font-size: 18px; max-width: 600px; margin: 0 auto; line-height: 1.6; }

.contact-main { background: #000; padding-bottom: 100px; }
.direct-contact { display: flex; flex-direction: column; gap: 30px; }
.direct-contact h2 { font-size: 24px; color: #fff; font-family: 'Cormorant Garamond', serif; margin-bottom: 10px; }
.contact-link { display: flex; align-items: center; gap: 15px; color: #aaa; text-decoration: none; font-size: 15px; transition: 0.3s; }
.contact-link:hover { color: #ffffff; }
.contact-link .icon-box { width: 40px; height: 40px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; transition: 0.3s; }
.contact-link:hover .icon-box { border-color: rgba(255,255,255,0.6); background: rgba(255,255,255,0.05); }

.callback-box { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.12); border-radius: 16px; padding: 20px; display: flex; align-items: center; gap: 15px; cursor: pointer; transition: 0.3s; margin-top: 20px; }
.callback-box:hover { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.3); }
.callback-box .cb-icon { width: 45px; height: 45px; background: rgba(255,255,255,0.08); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 20px; }
.callback-box .cb-text h4 { color: #fff; font-size: 15px; margin: 0 0 5px; font-weight: 600; }
.callback-box .cb-text p { color: #888; font-size: 13px; margin: 0; }
.callback-box .arrow { margin-left: auto; color: #ffffff; font-size: 20px; }

.promise-box { background: rgba(25,25,25,0.5); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 25px; margin-top: 20px; }
.promise-box h5 { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 20px; }
.promise-box ul { list-style: none; padding: 0; margin: 0; }
.promise-box li { display: flex; align-items: center; gap: 12px; color: #aaa; font-size: 14px; margin-bottom: 15px; }
.promise-box li:last-child { margin-bottom: 0; }
.promise-box li i { color: #ffffff; font-size: 14px; }

/* Form Styles */
.custom-form { background: rgba(25,25,25,0.5); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 40px; }
.form-section-title { font-size: 11px; color: #ffffff; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 15px; font-weight: 600; }
.custom-form .form-group { margin-bottom: 25px; }
.custom-form label { display: block; font-size: 12px; color: #888; margin-bottom: 8px; font-weight: 500; }
.custom-input { width: 100%; background: #111; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 12px 15px; color: #fff; font-size: 14px; transition: 0.3s; }
.custom-input:focus { border-color: rgba(255,255,255,0.5); outline: none; }
.custom-input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(1); opacity: 0.5; }

/* Pills */
.pill-group { display: flex; flex-wrap: wrap; gap: 10px; }
.form-pill { padding: 8px 16px; border-radius: 30px; border: 1px solid rgba(255,255,255,0.15); background: transparent; color: #aaa; font-size: 13px; cursor: pointer; transition: 0.3s; font-weight: 500; }
.form-pill:hover { border-color: rgba(255,255,255,0.5); color: #ffffff; }
.form-pill.active { background: #ffffff; border-color: #ffffff; color: #000; font-weight: 600; }

/* Counters */
.counter-box { background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 12px 15px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.counter-box span { color: #aaa; font-size: 14px; }
.counter-controls { display: flex; align-items: center; gap: 15px; }
.counter-btn { width: 28px; height: 28px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.2); background: transparent; color: #aaa; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.3s; }
.counter-btn:hover { border-color: #ffffff; color: #ffffff; }
.counter-val { font-size: 14px; font-weight: 600; color: #fff; min-width: 15px; text-align: center; }

/* Add-ons */
.addon-btn { background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 12px 15px; display: flex; align-items: center; justify-content: space-between; color: #aaa; font-size: 14px; cursor: pointer; transition: 0.3s; margin-bottom: 10px; }
.addon-btn:hover { border-color: rgba(255,255,255,0.3); }
.addon-check { width: 20px; height: 20px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.2); transition: 0.3s; position: relative; }
.addon-btn.active .addon-check { border-color: #ffffff; background: #ffffff; }
.addon-btn.active .addon-check::after { content:''; position:absolute; left:6px; top:2px; width:5px; height:10px; border:solid #000; border-width:0 2px 2px 0; transform:rotate(45deg); }

.submit-btn { width: 100%; background: #000000; color: #fff; border: 1px solid #ffffff; border-radius: 30px; padding: 16px; font-size: 15px; font-weight: 700; cursor: pointer; transition: 0.3s; margin-top: 10px; letter-spacing: 2px; text-transform: uppercase; }
.submit-btn:hover { background: #ffffff; color: #000000; transform: scale(1.02); }

@media (max-width: 767px) {
    .contact-hero h1 { font-size: 40px; }
    .custom-form { padding: 25px; }
}
</style>"""

new_style = """<style>
/* Custom Contact Styles - White Background, Black Text */
.contact-hero { padding: 120px 0 60px; text-align: center; position: relative; background: #ffffff; overflow: hidden; }
.contact-hero::before { content:''; position:absolute; top:-100px; right:0; width:500px; height:500px; background: rgba(0,0,0,0.02); border-radius:50%; filter: blur(60px); pointer-events:none; }
.hero-tag { display: inline-flex; align-items: center; gap: 15px; margin-bottom: 20px; }
.hero-tag .line { height: 1px; width: 40px; background: #000000; }
.hero-tag span { color: #555555; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; font-weight: 600; }
.contact-hero h1 { font-size: 56px; font-weight: 900; color: #000; margin-bottom: 20px; font-family: 'Cormorant Garamond', serif; }
.contact-hero h1 .gold-italic { font-style: italic; color: #000000; font-weight: 400; }
.contact-hero p { color: #555; font-size: 18px; max-width: 600px; margin: 0 auto; line-height: 1.6; }

.contact-main { background: #f7f7f7; padding-bottom: 100px; }
.direct-contact { display: flex; flex-direction: column; gap: 30px; }
.direct-contact h2 { font-size: 24px; color: #000; font-family: 'Cormorant Garamond', serif; margin-bottom: 10px; }
.contact-link { display: flex; align-items: center; gap: 15px; color: #555; text-decoration: none; font-size: 15px; transition: 0.3s; }
.contact-link:hover { color: #000000; }
.contact-link .icon-box { width: 40px; height: 40px; border-radius: 50%; border: 1px solid rgba(0,0,0,0.15); display: flex; align-items: center; justify-content: center; transition: 0.3s; }
.contact-link:hover .icon-box { border-color: rgba(0,0,0,0.5); background: rgba(0,0,0,0.05); }

.callback-box { background: #ffffff; border: 1px solid rgba(0,0,0,0.1); border-radius: 16px; padding: 20px; display: flex; align-items: center; gap: 15px; cursor: pointer; transition: 0.3s; margin-top: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
.callback-box:hover { background: #f0f0f0; border-color: rgba(0,0,0,0.2); }
.callback-box .cb-icon { width: 45px; height: 45px; background: #000000; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 20px; }
.callback-box .cb-text h4 { color: #000; font-size: 15px; margin: 0 0 5px; font-weight: 600; }
.callback-box .cb-text p { color: #666; font-size: 13px; margin: 0; }
.callback-box .arrow { margin-left: auto; color: #000000; font-size: 20px; }

.promise-box { background: #ffffff; border: 1px solid rgba(0,0,0,0.08); border-radius: 16px; padding: 25px; margin-top: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
.promise-box h5 { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 20px; }
.promise-box ul { list-style: none; padding: 0; margin: 0; }
.promise-box li { display: flex; align-items: center; gap: 12px; color: #444; font-size: 14px; margin-bottom: 15px; }
.promise-box li:last-child { margin-bottom: 0; }
.promise-box li i { color: #000000; font-size: 14px; }

/* Form Styles */
.custom-form { background: #ffffff; border: 1px solid rgba(0,0,0,0.08); border-radius: 16px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
.form-section-title { font-size: 11px; color: #000000; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 15px; font-weight: 700; }
.custom-form .form-group { margin-bottom: 25px; }
.custom-form label { display: block; font-size: 12px; color: #666; margin-bottom: 8px; font-weight: 500; }
.custom-input { width: 100%; background: #f7f7f7; border: 1px solid rgba(0,0,0,0.12); border-radius: 8px; padding: 12px 15px; color: #000; font-size: 14px; transition: 0.3s; }
.custom-input:focus { border-color: #000000; outline: none; background: #fff; }
.custom-input::placeholder { color: #aaa; }

/* Pills */
.pill-group { display: flex; flex-wrap: wrap; gap: 10px; }
.form-pill { padding: 8px 16px; border-radius: 30px; border: 1px solid rgba(0,0,0,0.2); background: transparent; color: #555; font-size: 13px; cursor: pointer; transition: 0.3s; font-weight: 500; }
.form-pill:hover { border-color: #000000; color: #000000; }
.form-pill.active { background: #000000; border-color: #000000; color: #fff; font-weight: 600; }

/* Counters */
.counter-box { background: #f7f7f7; border: 1px solid rgba(0,0,0,0.08); border-radius: 12px; padding: 12px 15px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.counter-box span { color: #444; font-size: 14px; }
.counter-controls { display: flex; align-items: center; gap: 15px; }
.counter-btn { width: 28px; height: 28px; border-radius: 50%; border: 1px solid rgba(0,0,0,0.2); background: transparent; color: #555; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.3s; }
.counter-btn:hover { border-color: #000000; color: #000000; background: #f0f0f0; }
.counter-val { font-size: 14px; font-weight: 600; color: #000; min-width: 15px; text-align: center; }

/* Add-ons */
.addon-btn { background: #f7f7f7; border: 1px solid rgba(0,0,0,0.08); border-radius: 12px; padding: 12px 15px; display: flex; align-items: center; justify-content: space-between; color: #444; font-size: 14px; cursor: pointer; transition: 0.3s; margin-bottom: 10px; }
.addon-btn:hover { border-color: rgba(0,0,0,0.3); background: #f0f0f0; }
.addon-check { width: 20px; height: 20px; border-radius: 50%; border: 2px solid rgba(0,0,0,0.2); transition: 0.3s; position: relative; }
.addon-btn.active .addon-check { border-color: #000000; background: #000000; }
.addon-btn.active .addon-check::after { content:''; position:absolute; left:6px; top:2px; width:5px; height:10px; border:solid #fff; border-width:0 2px 2px 0; transform:rotate(45deg); }

.submit-btn { width: 100%; background: #000000; color: #fff; border: none; border-radius: 30px; padding: 16px; font-size: 15px; font-weight: 700; cursor: pointer; transition: 0.3s; margin-top: 10px; letter-spacing: 2px; text-transform: uppercase; }
.submit-btn:hover { background: #333333; transform: scale(1.02); }

@media (max-width: 767px) {
    .contact-hero h1 { font-size: 40px; }
    .custom-form { padding: 25px; }
}
</style>"""

html = html.replace(old_style, new_style)

with open('contact.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("Done - white background, black text applied")
