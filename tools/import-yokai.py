"""One-off import of the ChatGPT yokai research (art/incoming/yokai_research.txt) into the content files.
Parses the document (so texts are not retyped), adds the new words / patterns / shops, writes content/yokai.json. Everything is status "draft"."""
import json, re
L = [l.rstrip('\n') for l in open('art/incoming/yokai_research.txt', encoding='utf8')]
names = ['Kappa','Kitsune','Tanuki','Tengu','Yuki-onna','Zashiki-warashi','Kodama','Iso-onna','Chōchin-obake','Bake-neko','Shōjō','Makura-gaeshi']
tab = [[x.strip() for x in l.split(' | ')] for l in L if re.match(r'^\d+ \| ', l)]
lore = {}; i = L.index('2. Lore-Karten') + 1
while not L[i].startswith('3. Zwölf'):
    if L[i] in names: lore[L[i]] = (L[i+1], L[i+2].replace('Einordnung: ', '')); i += 3
    else: i += 1
quests = {}; cur = None; i = L.index('3. Zwölf Quests') + 1
while not L[i].startswith('4. Zusätzlicher'):
    if L[i] in names: cur = L[i]; quests[cur] = {}
    elif cur and ' | ' in L[i]:
        k, v = L[i].split(' | ', 1)
        if k != 'Element': quests[cur][k] = v
    i += 1

ID = dict(zip(names, ['kappa','kitsune','tanuki','tengu','yukionna','zashiki','kodama','isoonna','chochin','bakeneko','shojo','makura']))
JP = {'Kappa':'{河童|かっぱ}','Kitsune':'{狐|きつね}','Tanuki':'{狸|たぬき}','Tengu':'{天狗|てんぐ}','Yuki-onna':'{雪女|ゆきおんな}','Zashiki-warashi':'{座敷童子|ざしきわらし}','Kodama':'{木霊|こだま}',
      'Iso-onna':'{磯女|いそおんな}','Chōchin-obake':'{提灯|ちょうちん}お{化|ば}け','Bake-neko':'{化|ば}け{猫|ねこ}','Shōjō':'{猩々|しょうじょう}','Makura-gaeshi':'{枕|まくら}{返|がえ}し'}
PLACE = {'Kappa':'lake','Kitsune':'village','Tanuki':'woods','Tengu':'mountains','Yuki-onna':'mountains','Zashiki-warashi':'village','Kodama':'woods','Iso-onna':'shore','Chōchin-obake':'city','Bake-neko':'town','Shōjō':'shore','Makura-gaeshi':'city'}
ITEM = {'Kappa':'kyuuri','Kitsune':'aburaage','Tanuki':'mochi','Tengu':'ocha','Yuki-onna':'momo','Zashiki-warashi':'tamago','Kodama':'kusuri','Iso-onna':'sakana','Chōchin-obake':'pan','Bake-neko':'niku','Shōjō':'osake','Makura-gaeshi':'ringo'}
# (place of the shop, shop building) as named in NPC hint 1 of the document
SHOP = {'Kappa':('village','mise'),'Kitsune':('village','tofuya'),'Tanuki':('village','okashiya'),'Tengu':('mountains','chaya'),'Yuki-onna':('village','kudamonoya'),'Zashiki-warashi':('village','nouka'),
        'Kodama':('town','kusuriya'),'Iso-onna':('harbor','sakanaya'),'Chōchin-obake':('town','panya'),'Bake-neko':('town','nikuya'),'Shōjō':('harbor','mise'),'Makura-gaeshi':('town','kudamonoya')}

W = json.load(open('content/words.json')); have = {w['id'] for w in W}
def noun(id, jp, de, g, tags, **kw):
    if id in have: return
    d = dict(id=id, pos='noun', jp=jp, de=de, gender=g, ch=6, tags=tags, status='draft'); d.update(kw); W.append(d); have.add(id)
for id, jp, de, g, pl, loc in [('tofuya','とうふ{屋|や}','Tofuladen','m','Tofuläden','im Tofuladen'),('okashiya','おかし{屋|や}','Süßwarenladen','m','Süßwarenläden','im Süßwarenladen'),('chaya','{茶屋|ちゃや}','Teehaus','n','Teehäuser','im Teehaus'),
    ('kudamonoya','くだもの{屋|や}','Obstladen','m','Obstläden','im Obstladen'),('nouka','{農家|のうか}','Bauernhof','m','Bauernhöfe','auf dem Bauernhof'),('kusuriya','{薬屋|くすりや}','Apotheke','f','Apotheken','in der Apotheke'),
    ('sakanaya','{魚屋|さかなや}','Fischladen','m','Fischläden','im Fischladen'),('nikuya','{肉屋|にくや}','Metzgerei','f','Metzgereien','in der Metzgerei'),('panya','パン{屋|や}','Bäckerei','f','Bäckereien','in der Bäckerei'),
    ('minato','{港|みなと}','Hafen','m','Häfen','am Hafen')]:
    noun(id, jp, de, g, ['place', 'shop'], pl=pl, deLoc=loc, **({'kanjiCommon': False} if id in ('chaya','nouka') else {}))
noun('aburaage','{油揚|あぶらあ}げ','Tofu','m',['food','item'],mass=True,adj='frittiert',note='Dünne, frittierte Tofuscheiben.')
noun('mochi','もち','Reiskuchen','m',['food','item'],pl='Reiskuchen',note='Klebriger Reiskuchen (餅).')
for w in W:
    if w['id'] == 'osake': w['deGift'] = 'eine Flasche Sake'
json.dump(W, open('content/words.json', 'w'), ensure_ascii=False, indent=1)

P = json.load(open('content/patterns.json')); pat = {p['id']: p for p in P}
def fill(pid, f):
    if f not in pat[pid]['fills']: pat[pid]['fills'].append(f)
if 'p_place_shop' not in pat:
    P.append({"id": "p_place_shop", "ch": "6", "status": "draft", "title": "〇〇に 店が あります", "explain": "Ort に Geschäft が あります: „Dort gibt es einen Laden.“ に nennt den Ort, が das, was es dort gibt.",
              "jp": "<a> に <b> が あります。", "de": "[a.loc] gibt es [b.acc.indef].", "fills": [], "require": {"a": {"pos": "noun", "tagsAny": ["place"]}, "b": {"pos": "noun", "tagsAny": ["shop"]}}}); pat['p_place_shop'] = P[-1]
if 'p_dozo_item' not in pat:
    P.append({"id": "p_dozo_item", "ch": "6", "status": "draft", "title": "どうぞ。〜です。", "explain": "Etwas höflich überreichen: どうぞ („bitte sehr“) und dann sagen, was es ist.",
              "jp": "どうぞ。 <a> です。", "de": "Bitte sehr. Hier ist [a.gift].", "fills": [], "require": {"a": {"pos": "noun", "tagsAny": ["food", "drink", "item"]}}}); pat['p_dozo_item'] = P[-1]
Y = []
for n, row in zip(names, tab):
    yid = ID[n]; place, shop = SHOP[n]; item = ITEM[n]; q = quests[n]
    fill('p_place_shop', {"a": {'village':'mura','mountains':'yama','town':'machi','harbor':'minato'}[place], "b": shop})
    fill('p_item_place', {"a": item, "b": shop})
    fill('p_N_wo_kudasai', {"a": item}); fill('p_dozo_item', {"a": item})
    Y.append(dict(id=yid, jp=JP[n], rom=row[3], de=n if n != 'Chōchin-obake' else 'Chōchin-obake', deLong=row[4], place=PLACE[n], motifs=row[6], status='draft', einordnung=lore[n][1],
                  lore=lore[n][0], wish_de=q['Bitte'].strip('„“'), item=item, shop={'place': place, 'building': shop}, culture=q['Kulturdetail'],
                  docHints=[q['NPC-Hinweis 1'], q['NPC-Hinweis 2']], docGive=q['Übergabe']))
json.dump(P, open('content/patterns.json', 'w'), ensure_ascii=False, indent=1)
json.dump(Y, open('content/yokai.json', 'w'), ensure_ascii=False, indent=1)

wd = json.load(open('content/world.json'))
if not any(p['id'] == 'harbor' for p in wd['places']):
    wd['places'].append({"id": "harbor", "word": "minato", "art": "harbor", "x": 91, "y": 44, "lv": 3, "items": [], "animals": ["tori"]})
shops = {'village': {'mise': ['kyuuri','pan','ringo','kusuri','ocha'], 'tofuya': ['aburaage'], 'okashiya': ['mochi'], 'kudamonoya': ['momo','ringo'], 'nouka': ['tamago']},
         'town': {'kusuriya': ['kusuri'], 'panya': ['pan'], 'nikuya': ['niku'], 'kudamonoya': ['ringo','momo']}, 'mountains': {'chaya': ['ocha']}, 'harbor': {'sakanaya': ['sakana'], 'mise': ['osake']}}
for p in wd['places']: p['shops'] = [{'word': k, 'sells': v} for k, v in shops.get(p['id'], {}).items()]
wd['prices'] = {'kyuuri':15,'aburaage':30,'mochi':40,'ocha':10,'momo':60,'tamago':30,'kusuri':80,'sakana':50,'pan':50,'niku':120,'osake':100,'ringo':40}
json.dump(wd, open('content/world.json', 'w'), ensure_ascii=False, indent=1)
print(len(Y), 'yokai,', len(W), 'words,', len(P), 'patterns')
