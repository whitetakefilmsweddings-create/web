with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# The old duplicate block starts right after the NEW section ends,
# between the two "end custom-plan-ai-section" markers.
# Find the first end marker, then find the next one, delete everything between them.

marker = '<!-- end custom-plan-ai-section -->'
first = content.find(marker)
second = content.find(marker, first + 1)

if second != -1:
    # Find start of the "<!-- start pricing-section -->" AFTER the second marker
    # so we keep the clean pricing section
    pricing_marker = '<!-- start pricing-section -->'
    pricing_pos = content.find(pricing_marker, second)
    if pricing_pos != -1:
        # Remove everything between (inclusive) first end marker and pricing section
        # We want to keep the first end marker and then jump to the pricing section
        new_content = content[:first + len(marker)] + '\n\n    ' + content[pricing_pos:]
        with open('index.html', 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("Cleaned! Removed duplicate old AI section.")
    else:
        print("ERROR: pricing-section marker not found after second AI end marker.")
else:
    print("No duplicate found - already clean.")
