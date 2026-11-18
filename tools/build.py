# -*- coding: utf-8 -*-
"""Tao lai index.html + sao.html tu data/*.csv (thanh-vien, hanh-trinh, chuong, thay-co). Chi can Python 3."""
import base64, csv, hashlib, json, math, os, re, struct, unicodedata
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *a: os.path.join(ROOT, *a)

# ---- gia tri mac dinh khi o trong trong CSV ----
MAC_DINH = {
    "vai_tro": "Thành viên",
    "sinh_nhat": "Khóa 2023 – 2026",
    "cau_noi": "Thanh xuân của chúng ta bắt đầu từ chỗ ngồi cạnh nhau trong 12A1.",
    "loi_nhan": "Cảm ơn 12A1 đã cùng mình đi hết ba năm cấp ba. Chúc cả lớp luôn khỏe và mãi nhớ nhau.",
}
MAU = ["#FFFDF0","#FEF3C7","#FED7AA","#BAE6FD","#E0E7FF","#DDD6FE","#FBCFE8","#BBF7D0","#FEF08A","#A7F3D0","#E0F2FE","#C7D2FE"]

def doc_csv():
    with open(P("data", "thanh-vien.csv"), encoding="utf-8-sig", newline="") as f:
        rows = list(csv.reader(f))
    out = []
    for r in rows[1:]:
        r = (r + [""] * 11)[:11]
        if r[1].strip():
            out.append([c.strip() for c in r])
    return out

def vi_tri(n):  # cong thuc dat sao 3D giong code goc
    g = math.pi * (3 - math.sqrt(5)); res = []
    for a in range(n):
        i = (a / max(1, n - 1) * 2 - 1) * 8.5 + 1.5 * math.sin(1.3 * a)
        s = math.sqrt(max(.15, 1 - (i / 11) ** 2)); r = g * a
        res.append([round(math.cos(r) * s * 24 + 2 * math.cos(2.1 * a), 2), round(i, 2),
                    round(math.sin(r) * s * 14 + 2 * math.sin(1.7 * a), 2)])
    return res

PBKDF2_LAN = 100000
def khoa_cau(mat_khau, cau):
    """Mã hóa 1 câu bằng mật khẩu (PBKDF2-SHA256 + dòng khóa SHA-256). Trong file json KHÔNG có câu gốc.
    extra.js giải mã bằng WebCrypto với đúng các bước này."""
    mk = unicodedata.normalize("NFC", mat_khau.strip().lower())
    salt = os.urandom(16)
    bits = hashlib.pbkdf2_hmac("sha256", mk.encode("utf-8"), salt, PBKDF2_LAN, 64)
    kiem, khoa = bits[:32], bits[32:]
    raw = cau.encode("utf-8")
    ks = b"".join(hashlib.sha256(khoa + struct.pack(">I", i)).digest() for i in range((len(raw) + 31) // 32))
    ct = bytes(a ^ b for a, b in zip(raw, ks))
    b64 = lambda x: base64.b64encode(x).decode()
    return {"s": b64(salt), "c": b64(kiem), "e": b64(ct)}

def khop_mang(t, a):  # tim dau ] khop voi [ tai vi tri a (bo qua ky tu trong chuoi)
    d = 0; ins = False; esc = False
    for k in range(a, len(t)):
        c = t[k]
        if ins:
            if esc: esc = False
            elif c == "\\": esc = True
            elif c == '"': ins = False
        elif c == '"': ins = True
        elif c == "[": d += 1
        elif c == "]":
            d -= 1
            if d == 0: return k
    raise SystemExit("Khong tim thay het mang thanh vien trong index.goc.html")

def doc_bang(ten, so_cot):
    """Doc 1 file CSV trong data/. Tra ve None neu khong co file. Bo dong trong."""
    f = P("data", ten)
    if not os.path.exists(f): return None
    with open(f, encoding="utf-8-sig", newline="") as fh:
        rows = list(csv.reader(fh))
    out = []
    for r in rows[1:]:
        r = [c.strip() for c in (r + [""] * so_cot)[:so_cot]]
        if any(r): out.append(r)
    return out

def duong_dan(anh, thu_muc):
    """Ten file tran -> them thu muc; da co / hoac http thi giu nguyen."""
    anh = anh.strip()
    if not anh or anh.startswith(("/", "http")): return anh
    return thu_muc + anh

def so_lop(lop):  # "10A1" -> "10"
    m = re.match(r"\d+", lop); return m.group(0) if m else ""

CHUONG = {"10": "chapter10", "11": "chapter11", "12": "chapter12"}

def ap_hanh_trinh(data):
    """hanh-trinh.csv + chuong.csv -> data['timeline']"""
    tl = data["timeline"]
    ch = doc_bang("chuong.csv", 6)
    if ch:
        for lop, cau_phu, gioi_thieu, tieu_de_ket, cau_ket, anh in ch:
            k = CHUONG.get(so_lop(lop))
            if not k: continue
            for truong, gt in (("subtitle", cau_phu), ("introQuote", gioi_thieu), ("closingTitle", tieu_de_ket),
                               ("closingQuote", cau_ket), ("closingGroupPhoto", duong_dan(anh, "./media/images/"))):
                if gt: tl[k][truong] = gt          # o trong = giu gia tri cu
    ev = doc_bang("hanh-trinh.csv", 8)
    if ev is not None:
        moi = {k: [] for k in CHUONG.values()}
        for lop, tg, nhan, td, mt, anh, phu, vt in ev:
            k = CHUONG.get(so_lop(lop))
            if not k: print("  ! hanh-trinh.csv: bo qua dong co lop la '%s' (phai la 10A1 / 11A1 / 12A1)" % lop); continue
            moi[k].append({"id": "%s-%02d" % (so_lop(lop), len(moi[k]) + 1), "monthYear": tg, "title": td, "description": mt,
                "primaryImage": duong_dan(anh, "./media/images/"), "imagePosition": vt or "center 50%", "imageFit": "cover",
                "secondaryImages": [duong_dan(x, "./media/images/") for x in phu.split(";") if x.strip()], "tag": nhan})
        for k, lst in moi.items(): tl[k]["events"] = lst
        print("  Hanh trinh:", ", ".join("%s=%d moc" % (k[-2:], len(v)) for k, v in moi.items()))

def ap_hero(data):
    """Trang chủ chỉ dùng 1 ảnh bìa: images/home/lop-12a1.jpg"""
    h = data["hero"]; s0 = dict(h["slides"][0])
    s0.update({"src": ANH_BIA, "alt": "Cả lớp 12A1 trong ngày tốt nghiệp", "label": "Cả lớp 12A1",
               "caption": "Ba năm, một tập thể — 12A1", "objectPosition": "50% 78%", "order": 1})
    h["slides"] = [s0]

def ap_thay_co(data):
    """thay-co.csv -> data['galaxyTeachers'] (GVCN) va data['subjectTeachers'] (bo mon)"""
    rows = doc_bang("thay-co.csv", 9)
    if rows is None: return
    gv, bm = [], []
    for loai, ten, vt, nh, mon, cau, anh, vtanh, loi in rows:
        gvcn = loai.lower().startswith("gv")
        so = re.search(r"(\d+)A", vt)
        d = {"id": ("t-" + so.group(1)) if (gvcn and so) else ("t-%02d" % (len(gv) + 1) if gvcn else "st-%02d" % (len(bm) + 1)),
             "name": ten, "role": vt, "period": nh, "subject": mon,
             "avatar": duong_dan(anh, "./images/teachers/"), "imagePosition": vtanh or "50% 50%", "imageFit": "cover",
             "quote": cau, "description": loi, "isHeadTeacher": gvcn}
        (gv if gvcn else bm).append(d)
    data["galaxyTeachers"], data["subjectTeachers"] = gv, bm
    print("  Thay co: %d GVCN, %d giao vien bo mon" % (len(gv), len(bm)))


# ================== TACH MOI MUC RA 1 TRANG ==================
# (file, ma_trang, [id section giu lai], khoa du lieu can, tieu de tab)
ANH_BIA = "./images/home/lop-12a1.jpg"   # ảnh trang chủ (đổi file này là đổi ảnh bìa)
TIEU_DE_GOC = "Kỷ Yếu 12A1 — Chúng Ta Của Những Năm Tháng Ấy (2023 - 2026)"
TRANG = [

    ("video.html",       "video",        ["videos"],                   ["videos"],                            "Video Kỷ Niệm — Kỷ Yếu 12A1"),
    ("khoanh-khac.html", "khoanh-khac",  ["moments", "memory-wall"],   ["moments", "memoryWall"],             "Khoảnh Khắc — Kỷ Yếu 12A1"),
    # 3 trang dưới do extra/extra.js tự vẽ (đọc data/*.csv / *.json) nên không cần section nào của bản gốc
    ("hanh-trinh.html",  "x-hanh-trinh", [],                           [],                                    "Hành Trình 3 Năm — Kỷ Yếu 12A1"),
    ("thay-co.html",     "thay-co",      ["teachers"],                 ["galaxyTeachers", "subjectTeachers"], "Thầy Cô — Kỷ Yếu 12A1"),
    ("luu-but.html",     "luu-but",      ["letters"],                  ["letters"],                           "Lưu Bút — Kỷ Yếu 12A1"),
    ("phong-12a1.html",  "x-phong",      [],                           [],                                    "Phòng 12A1 — Kỷ Yếu 12A1"),
    ("tra-bai-cu.html",  "x-tra-bai",    [],                           [],                                    "Trả Bài Cũ — Kỷ Yếu 12A1"),
    ("ket-thuc.html",    "ket-thuc",     ["countdown", "finale"],      ["countdown", "finale"],               "Lời Kết — Kỷ Yếu 12A1"),
]
# thứ tự menu trên đầu trang (sao.html = Thành viên)
MENU_THU_TU = ["./index.html", "./sao.html", "./video.html", "./khoanh-khac.html", "./hanh-trinh.html", "./thay-co.html", "./luu-but.html", "./phong-12a1.html"]
# menu: href cu (trong trang) -> trang rieng
LINK_MENU = {"#members": "./sao.html", "#hero": "./index.html", "#moments": "./khoanh-khac.html", "#videos": "./video.html", "#journey": "./hanh-trinh.html",
             "#teachers": "./thay-co.html", "#letters": "./luu-but.html", "#room-12a1": "./phong-12a1.html"}
def sap_menu(html):
    """Sắp lại các link trong <nav> đầu trang theo MENU_THU_TU."""
    m = re.search(r'(<nav class="hidden md:flex[^>]*>)(.*?)(</nav>)', html, re.S)
    if not m: return html
    ac = re.compile(r'<a href="([^"]*)".*?</a>', re.S)
    links = list(ac.finditer(m.group(2)))
    if not links: return html
    first, last = links[0].start(), links[-1].end()
    items = sorted([(MENU_THU_TU.index(x.group(1)) if x.group(1) in MENU_THU_TU else 99, x.group(0)) for x in links], key=lambda z: z[0])
    inner = m.group(2)[:first] + "".join(s for _, s in items) + m.group(2)[last:]
    return html[:m.start(2)] + inner + html[m.end(2):]

NO_SPLASH = '<script>document.documentElement.className+=" x12-nosplash"</script>'

JS_FILES = [("_next", "static", "chunks", "app", "page-bfd83ee9de862124.js"), ("_next", "static", "chunks", "page-bfd83ee9de862124.js")]
JS_MARK = '"page"===t.mode'
JS_PAGE = (
 'if("page"===t.mode){let pk=t.page,pe=[],vd=(t.videos||[]).filter(e=>e.isPublished);'
 '"home"===pk&&pe.push((0,a.jsx)(x,{data:t.hero,onStartJourney:()=>{window.dispatchEvent(new CustomEvent("start-yearbook-audio")),window.location.href="./sao.html"},onToggleMusic:r,isMusicPlaying:n},"hero"));'
 '"khoanh-khac"===pk&&pe.push((0,a.jsx)(J,{moments:t.moments},"moments"),(0,a.jsx)(eh,{items:t.memoryWall},"memory-wall"));'
 '"video"===pk&&pe.push(vd.length?(0,a.jsx)(eT,{videos:t.videos},"videos"):(0,a.jsxs)("section",{id:"videos",className:"relative",style:{padding:"8rem 1rem 7rem",textAlign:"center",background:"#FAF8F5",color:"#292218"},children:['
 '(0,a.jsx)("h2",{style:{fontFamily:"var(--font-serif), \'Cormorant Garamond\', Georgia, serif",fontSize:"clamp(2rem,5vw,3rem)",fontWeight:700},children:"Video Kỷ Niệm 12A1"}),'
 '(0,a.jsx)("p",{style:{marginTop:"1rem",color:"#6b5b3e",fontWeight:300},children:"Video kỷ niệm sẽ sớm được cập nhật. Hãy quay lại sau nhé!"})]},"videos"));'
 '"hanh-trinh"===pk&&pe.push((0,a.jsx)(es,{chapter10:t.timeline.chapter10,chapter11:t.timeline.chapter11,chapter12:t.timeline.chapter12},"journey"));'
 '"thay-co"===pk&&pe.push((0,a.jsx)(eo,{headTeachers:t.galaxyTeachers,subjectTeachers:t.subjectTeachers},"teachers"));'
 '"luu-but"===pk&&pe.push((0,a.jsx)(eu,{letters:t.letters},"letters"));'
 '"phong-12a1"===pk&&pe.push((0,a.jsx)(e_,{},"room"));'
 '"ket-thuc"===pk&&pe.push((0,a.jsx)(ew,{data:t.countdown},"countdown"),(0,a.jsx)(ev,{config:t.finale,onRestart:()=>{window.location.href="./index.html"},onOpenGallery:()=>{window.location.href="./khoanh-khac.html"}},"finale"));'
 'return(0,a.jsxs)("main",{className:"relative min-h-screen bg-[#FAF8F5] pg-"+pk,children:[(0,a.jsx)(l,{onToggleMusic:r}),pe,(0,a.jsx)(eX,{onAudioStarted:()=>s(!0)})]})}'
)
JS_ANCHOR = 'return(0,a.jsxs)("main",{className:"relative min-h-screen bg-[#FAF8F5]",children:[(0,a.jsx)(l,{onToggleMusic:r}),'

def ap_js():
    """Them che do 'page' + doi link menu sang trang rieng trong JS da bien dich (chay lai nhieu lan van an toan)."""
    for parts in JS_FILES:
        f = P(*parts)
        if not os.path.exists(f): continue
        t = open(f, encoding="utf-8").read(); goc = t
        if JS_MARK not in t:
            if t.count(JS_ANCHOR) != 1: raise SystemExit("Khong tim thay diem chen trong " + f)
            t = t.replace(JS_ANCHOR, JS_PAGE + JS_ANCHOR)
        for cu, moi in LINK_MENU.items():
            t = t.replace('href:"%s"' % cu, 'href:"%s"' % moi)
        t = t.replace('d(e,"#hero")', 'd(e,"/")')
        a1 = '{name:"Khoảnh khắc",href:"./khoanh-khac.html"}'; a2 = '{name:"Video",href:"./video.html"}'   # Video đứng trước Khoảnh khắc
        t = t.replace(a1 + "," + a2, a2 + "," + a1)
        # Thầy cô: chỉ còn 1 cô chủ nhiệm cho cả 3 năm
        t = t.replace('children:"Ba Người C\\xf4 Chủ Nhiệm K\\xednh Y\\xeau"', 'children:"Cô Chủ Nhiệm Kính Yêu"')
        if t != goc: open(f, "w", encoding="utf-8").write(t)

def con_cap_1(html):
    """Tra ve danh sach (tag, bat_dau, ket_thuc, id) cua cac phan tu con truc tiep cua <main>, va (m_start, m_open_end)."""
    tok = re.compile(r"<(/?)([a-zA-Z0-9]+)([^>]*?)(/?)>", re.S)
    void = {"meta","link","img","br","input","path","circle","line","rect","source","hr","polyline","polygon","ellipse","use","stop"}
    m0 = html.index("<main "); pos = m0; stack = []; out = []; open_end = None
    while True:
        m = tok.search(html, pos)
        if not m: break
        close, tag, attrs, selfc = m.groups()
        if tag in ("script", "style") and not close:
            pos = html.index("</" + tag + ">", m.end()) + len(tag) + 3; continue
        pos = m.end()
        if tag in void or selfc: continue
        if not close:
            if len(stack) == 0: open_end = m.end()
            if len(stack) == 1:
                i = re.search(r'id="([^"]*)"', attrs)
                out.append([tag, m.start(), None, i.group(1) if i else tag])
            stack.append(tag)
        else:
            stack.pop()
            if len(stack) == 1: out[-1][2] = m.end()
            if not stack: return out, m0, open_end, m.start(), m.end()
    raise SystemExit("Khong doc duoc cau truc <main>")

VIDEO_TRONG = ('<section id="videos" class="relative" style="padding:8rem 1rem 7rem;text-align:center;background:#FAF8F5;color:#292218">'
    '<h2 style="font-family:var(--font-serif), &#x27;Cormorant Garamond&#x27;, Georgia, serif;font-size:clamp(2rem,5vw,3rem);font-weight:700">Video Kỷ Niệm 12A1</h2>'
    '<p style="margin-top:1rem;color:#6b5b3e;font-weight:300">Video kỷ niệm sẽ sớm được cập nhật. Hãy quay lại sau nhé!</p></section>')

def tao_trang(goc_html, data_goc, ma, ids, khoa, tieu_de):
    """Dung 1 trang rieng tu ban goc: giu header + cac section trong ids + trinh phat nhac."""
    html = goc_html
    ch, m0, m_open_end, last_start, m_end = con_cap_1(html)
    by = {c[3]: c for c in ch}
    header = html[by["header"][1]:by["header"][2]]
    for cu, moi in LINK_MENU.items():
        header = header.replace('href="%s"' % cu, 'href="%s"' % moi)
    header = sap_menu(header)
    phan = []
    for i in ids:
        if i in by: phan.append(html[by[i][1]:by[i][2]])
        elif i == "videos": phan.append(VIDEO_TRONG)       # chua co video nao duoc dang -> o trang thong bao
        else: raise SystemExit("Khong co section #%s trong ban goc" % i)
    player = html[by["music-player"][1]:by["music-player"][2]]
    m_open = '<main class="relative min-h-screen bg-[#FAF8F5] pg-%s">' % ma
    html = html[:m0] + m_open + header + "".join(phan) + player + html[last_start:]
    if tieu_de: html = html.replace(TIEU_DE_GOC, tieu_de)
    if ma != "home":
        html = re.sub(r'<link rel="preload" as="image" href="[^"]*"/>', "", html)
        html = html.replace("</head>", NO_SPLASH + "</head>", 1)
    else:   # trang chủ: chỉ preload ảnh bìa mới
        html = re.sub(r'<link rel="preload" as="image" href="[^"]*"/>', "", html)
        html = html.replace("</head>", '<link rel="preload" as="image" href="%s"/>' % ANH_BIA + "</head>", 1)
    return html



def tao_so_tay(ds):
    """Tao trang chu index.html (So Tay Thanh Xuan 3D) tu tools/sketchbook.template.html va du lieu CSV."""
    tpl_path = P("tools", "sketchbook.template.html")
    if not os.path.exists(tpl_path):
        return
    ch_rows = doc_bang("chuong.csv", 6) or []
    tc_rows = doc_bang("thay-co.csv", 9) or []
    ht_rows = doc_bang("hanh-trinh.csv", 7) or []
    embed = {
        "className": "12A1",
        "years": "2023 – 2026",
        "memberCount": len(ds),
        "members": [r[1] for r in ds if len(r) > 1 and r[1]],
        "chapters": [
            {"lop": r[0], "sub": r[1], "intro": r[2], "closeTitle": r[3], "closeQuote": r[4], "photo": r[5]}
            for r in ch_rows
        ],
        "teachers": [
            {"loai": r[0], "name": r[1], "role": r[2], "mon": r[4], "quote": r[5], "photo": r[6]}
            for r in tc_rows
        ],
        "journeyCount": len(ht_rows),
    }
    tpl = open(tpl_path, encoding="utf-8").read()
    html = tpl.replace("__EMBEDDED_DATA_JSON__", json.dumps(embed, ensure_ascii=False).replace("<", "\u003c"))
    open(P("index.html"), "w", encoding="utf-8").write(html)

def main():
    ds = doc_csv(); n = len(ds)
    if n == 0: raise SystemExit("data/thanh-vien.csv dang trong!")
    pos = vi_tri(n); mem = []
    for i, r in enumerate(ds):
        num = "%02d" % (i + 1); stt, ten, bd, vt, sn, st, cn, ln, anh, mk, cr = r
        anh = anh or "member-%s.jpg" % num
        mem.append({"id": "m" + num, "name": ten, "nickname": bd or ten.split()[-1],
            "role": vt or MAC_DINH["vai_tro"], "birthday": sn or MAC_DINH["sinh_nhat"],
            "avatar": "./images/members/" + anh, "imagePrimary": "./images/members/" + anh,
            "imageSecondary": "./images/members/member-%s-candid.jpg" % num,
            "hobbies": [x.strip() for x in st.split(";") if x.strip()],
            "quote": cn or MAC_DINH["cau_noi"], "message": ln or MAC_DINH["loi_nhan"],
            "position": pos[i], "color": MAU[i % len(MAU)], "constellationGroup": 1})
    goc = open(P("tools", "index.goc.html"), encoding="utf-8").read()
    pat = re.compile(r"<script>self\.__next_f\.push\((\[.*?\])\)</script>", re.S)

    def tao(mode, trang=None):
        """mode = 'stars' (trang sao rieng) hoac 'page' (cac trang con lai, xem TRANG)"""
        done = [False]
        def thay(m):
            v = json.loads(m.group(1))
            if len(v) > 1 and isinstance(v[1], str) and '"members":[{"id":"m01"' in v[1]:
                t = v[1]; a = t.find('"data":') + len('"data":')
                data, kt = json.JSONDecoder().raw_decode(t[a:])
                data["members"] = mem
                ap_hero(data); ap_thay_co(data)
                if mode == "stars":   # trang sao chi can thanh vien + thay co chu nhiem
                    data = {"mode": "stars", "members": data["members"], "galaxyTeachers": data.get("galaxyTeachers", [])}
                else:                 # trang rieng: chi giu du lieu cua muc do
                    data = dict({"mode": "page", "page": trang[1]}, **{k: data[k] for k in trang[3] if k in data})
                t = t[:a] + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + t[a + kt:]
                done[0] = True
                return "<script>self.__next_f.push(" + json.dumps([v[0], t], ensure_ascii=False, separators=(",", ":")).replace("<", "\\u003c") + ")</script>"
            return m.group(0)
        html = pat.sub(thay, goc)
        if not done[0]: raise SystemExit("Khong tim thay du lieu trong index.goc.html")
        html = re.sub(r"(Bầu trời 3D \(<!-- -->)\d+(<!-- --> vì sao\))", r"\g<1>%d\2" % n, html)
        html = re.sub(r"hội tụ \d+ vì sao", "hội tụ %d vì sao" % n, html)
        html = re.sub(r"đón nhận \d+ cô cậu", "đón nhận %d cô cậu" % n, html)
        if mode == "page":
            return tao_trang(html, None, trang[1], trang[2], trang[3], trang[4])
        a = html.index('<section id="members"'); b = html.index('<section id="moments"')
        if True:
            sao = html[a:b]
            mp = html.index('<div id="music-player"'); mp_end = html.index("</main>", mp)
            m0 = html.index("<main "); m1 = html.index(">", m0) + 1
            html = (html[:m0] + '<main class="relative min-h-screen bg-[#070b16] sao-main">' + sao + html[mp:mp_end] + html[mp_end:])
            # bo anh preload cua trang chinh (tru may), doi tieu de
            html = re.sub(r'<link rel="preload" as="image" href="(?!\./images/galaxy-clouds)[^"]*"/>', "", html)
            html = html.replace("Kỷ Yếu 12A1 — Chúng Ta Của Những Năm Tháng Ấy (2023 - 2026)", "Những Ngôi Sao Của 12A1 — Kỷ Yếu 12A1")
            for cu, moi in LINK_MENU.items(): html = html.replace('href="%s"' % cu, 'href="%s"' % moi)
            html = sap_menu(html)
            html = html.replace("</head>", NO_SPLASH + "</head>", 1)
        return html

    ap_js()
    tao_so_tay(ds)
    for t in TRANG: open(P(t[0]), "w", encoding="utf-8").write(tao("page", t))
    open(P("sao.html"), "w", encoding="utf-8").write(tao("stars"))
    # Trả bài cũ: tên + lời chúc (cột loi_nhan) của từng bạn
    json.dump([{"n": m["name"], "w": m["message"]} for m in mem], open(P("data", "thanh-vien.json"), "w", encoding="utf-8"), ensure_ascii=False)
    # Phòng 12A1: mỗi bạn 1 mật khẩu (cột mat_khau), mở khóa ra cau_rieng (hoặc cau_noi). Câu được mã hóa.
    phong, co_mk = [], 0
    for r in ds:
        ten, cn, mk, cr = r[1], r[6], r[9], r[10]
        d = {"n": ten}
        if mk:
            d.update(khoa_cau(mk, cr or cn or MAC_DINH["cau_noi"])); co_mk += 1
        phong.append(d)
    json.dump({"it": PBKDF2_LAN, "m": phong}, open(P("data", "phong.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    print("  Phong 12A1: %d / %d ban da co mat khau" % (co_mk, n))
    print("Xong! Da tao %d trang: %s + sao.html (Nhung Ngoi Sao, %d thanh vien)." % (len(TRANG), ", ".join(t[0] for t in TRANG), n))

if __name__ == "__main__":
    main()
