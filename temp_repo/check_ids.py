ids = ['app-shell','sidebar','sidebar-toggle','sidebar-icon-rail','sidebar-scroll','sidebar-cta-area',
       'run-button','kpi-corpus','kpi-success','kpi-age','kpi-expense','narrative-text','narrative-accent',
       'journeyChart','histogramChart','drawdownChart','toast-container','comparison-panel',
       'comparison-table','validation-errors','scenario-count','age-timeline']

with open('index.html', encoding='utf-8') as f:
    html = f.read()

for id in ids:
    found = f'id="{id}"' in html
    print(f'  [{"OK" if found else "MISSING"}] #{id}')

print('v3.css linked:', 'v3.css' in html)
print('v3_logic.js linked:', 'v3_logic.js' in html)
