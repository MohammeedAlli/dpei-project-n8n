export type Section = { id: string; title: { ar: string; en: string }; body: { ar: string[]; en: string[] } };

/** {brand} and {months} are filled in by the page. Plain paragraphs; a line starting with "• " becomes a list item. */
export const PRIVACY: Section[] = [
  {
    id: 'who',
    title: { ar: 'مين إحنا', en: 'Who we are' },
    body: {
      ar: ['{brand} موقع لمقارنة أسعار المكونات الإلكترونية وطلبها من محلات شريكة في مصر. إحنا المسؤولين عن البيانات اللي بتدخلها هنا، وبنتعامل معاها وفق قانون حماية البيانات الشخصية المصري رقم 151 لسنة 2020.'],
      en: ['{brand} is a website for comparing prices of electronic components and ordering them from partner shops in Egypt. We are responsible for the data you enter here, and we handle it under Egypt\'s Personal Data Protection Law No. 151 of 2020.'],
    },
  },
  {
    id: 'collect',
    title: { ar: 'البيانات اللي بنجمعها', en: 'What we collect' },
    body: {
      ar: [
        '• عند الطلب: الاسم، رقم الموبايل، المحافظة، العنوان، الملاحظات (لو كتبتها)، والمنتجات المطلوبة. الدفع عند الاستلام، فمفيش بيانات كروت أو حسابات بنكية.',
        '• تتبع الطلب: الكود ورقم الموبايل اللي بتكتبهم. بنسجّل محاولات التتبع والطلب بشكل مشفّر (hash) مع عنوان الـ IP لمنع التخمين والسبام.',
        '• المساعد الذكي: الرسائل، والملفات (صور أو PDF) والتسجيلات الصوتية اللي ترسلها، ورقم جلسة عشوائي بيحفظه المتصفح.',
        '• التنبيهات والنشرة: الإيميل لو اشتركت في تنبيهات الأسعار.',
        '• حسابات المحلات والإدارة: الإيميل وكلمة المرور (بتتخزن مشفّرة عند مزوّد المصادقة).',
      ],
      en: [
        '• When you order: name, mobile number, governorate, address, notes (if any) and the items ordered. Payment is cash on delivery, so we hold no card or bank details.',
        '• Order tracking: the code and mobile number you type. We log tracking and order attempts in hashed form together with the IP address to stop guessing and spam.',
        '• AI assistant: the messages, files (images or PDFs) and voice recordings you send, and a random session id kept by your browser.',
        '• Alerts and newsletter: your email, if you subscribe to price alerts.',
        '• Shop and admin accounts: email and password (stored hashed by the authentication provider).',
      ],
    },
  },
  {
    id: 'why',
    title: { ar: 'ليه بنستخدمها', en: 'Why we use it' },
    body: {
      ar: [
        '• تنفيذ طلبك وتوصيله وإظهار حالته.',
        '• التواصل معاك لتأكيد الطلب، خصوصًا الطلبات الكبيرة أو المشكوك فيها.',
        '• الحماية من الطلبات الوهمية والاستخدام المسيء.',
        '• الرد على أسئلتك في المساعد الذكي، وإرسال تنبيهات الأسعار لو طلبتها (بموافقتك).',
      ],
      en: [
        '• To fulfil and deliver your order and show its status.',
        '• To contact you to confirm the order, especially large or suspicious ones.',
        '• To protect against fake orders and abuse.',
        '• To answer your questions in the AI assistant, and to send price alerts if you ask (with your consent).',
      ],
    },
  },
  {
    id: 'share',
    title: { ar: 'مين بيستلم بياناتك', en: 'Who receives your data' },
    body: {
      ar: [
        '• المحل الشريك: بياناتك الضرورية للتوصيل (الاسم، الموبايل، العنوان، المنتجات) بتوصل للمحل اللي عنده شحنتك بس.',
        '• مزوّدو الخدمة: الاستضافة، وقاعدة البيانات، وأداة الأتمتة، ومزوّد نموذج الذكاء الاصطناعي اللي بيعالج رسائل المساعد. الملفات والتسجيلات اللي ترسلها للمساعد بتتعالج عندهم، فمترفعش مستندات شخصية.',
        'مبنبيعش بياناتك ولا بنشاركها لأغراض إعلانية.',
      ],
      en: [
        '• The partner shop: the data needed for delivery (name, mobile, address, items) goes only to the shop that holds your shipment.',
        '• Service providers: hosting, database, automation tooling, and the AI model provider that processes assistant messages. Files and recordings you send to the assistant are processed by them, so do not upload personal documents.',
        'We do not sell your data or share it for advertising.',
      ],
    },
  },
  {
    id: 'keep',
    title: { ar: 'مدة الاحتفاظ', en: 'How long we keep it' },
    body: {
      ar: [
        '• الطلبات: {months} شهر، وبعدها بنخفي الاسم والعنوان والملاحظات ونخفي الموبايل جزئيًا (بنحتفظ بالمبالغ والمنتجات للمحاسبة).',
        '• سجلات منع السبام: أيام قليلة بس.',
        '• المساعد الذكي: المحادثة بتفضل في ذاكرة المساعد لحد ما تبدأ "محادثة جديدة".',
        '• الإيميل: لحد ما تلغي الاشتراك.',
      ],
      en: [
        '• Orders: {months} months, after which we blank the name, address and notes and partly mask the mobile number (amounts and items are kept for accounting).',
        '• Anti-spam logs: a few days only.',
        '• AI assistant: the conversation stays in the assistant\'s memory until you start a "New chat".',
        '• Email: until you unsubscribe.',
      ],
    },
  },
  {
    id: 'rights',
    title: { ar: 'حقوقك', en: 'Your rights' },
    body: {
      ar: [
        'ليك الحق إنك تعرف البيانات اللي عندنا عنك، وتصحّحها، وتطلب حذفها أو إخفاءها، وتسحب موافقتك على التنبيهات، وتعترض على معالجتها. ابعتلنا طلبك من وسائل التواصل أدناه ومعاه كود الطلب والموبايل عشان نتأكد إنه إنت، وهنرد في أقرب وقت (نستهدف خلال 30 يومًا). ولك كمان الحق في تقديم شكوى لمركز حماية البيانات الشخصية.',
      ],
      en: [
        'You may ask what data we hold about you, have it corrected, ask for it to be deleted or anonymised, withdraw consent to alerts, and object to its processing. Send your request using the contact details below, with your order code and mobile number so we can verify it is you; we aim to reply within 30 days. You can also complain to Egypt\'s Personal Data Protection Centre.',
      ],
    },
  },
  {
    id: 'security',
    title: { ar: 'الحماية', en: 'Security' },
    body: {
      ar: ['بنستخدم HTTPS، وصلاحيات وصول محدودة حسب الدور، وحدود على المحاولات المتكررة. مفيش نظام آمن 100%، ولو حصل تسريب هنبلّغك والجهات المختصة حسب القانون.'],
      en: ['We use HTTPS, role-based access limits and limits on repeated attempts. No system is 100% secure; if a breach affects you we will tell you and the authorities as the law requires.'],
    },
  },
  {
    id: 'cookies',
    title: { ar: 'الكوكيز والتخزين المحلي', en: 'Cookies and local storage' },
    body: {
      ar: [
        'بنستخدم تخزين ضروري بس لتشغيل الموقع: محتوى السلة، المفضلة، قائمة المقارنة، اللغة والمظهر، رقم جلسة المساعد، وتذكّر إنك قفلت إشعار الخصوصية. وكوكيز تسجيل الدخول لحسابات المحلات والإدارة.',
        'حاليًا مفيش أدوات تتبع أو إعلانات. لو أضفنا أي منها هنطلب موافقتك الأول.',
      ],
      en: [
        'We use only the storage needed to run the site: cart contents, wishlist, compare list, language and theme, the assistant session id, and remembering that you dismissed the privacy notice. Plus login cookies for shop and admin accounts.',
        'There are currently no tracking or advertising tools. If we add any, we will ask for your consent first.',
      ],
    },
  },
  {
    id: 'changes',
    title: { ar: 'التعديلات', en: 'Changes' },
    body: {
      ar: ['لو عدّلنا السياسة هنغيّر تاريخ آخر تحديث في أول الصفحة.'],
      en: ['If we change this policy we will update the date at the top of the page.'],
    },
  },
];

export const TERMS: Section[] = [
  {
    id: 'service',
    title: { ar: 'الخدمة', en: 'The service' },
    body: {
      ar: ['{brand} بيقارن أسعار المكونات الإلكترونية من محلات شريكة، وبيسهّل عليك طلبها. البيع والتوصيل بيتم من المحل الشريك، مش من الموقع.'],
      en: ['{brand} compares electronic component prices from partner shops and makes ordering easier. The sale and delivery are carried out by the partner shop, not by the website.'],
    },
  },
  {
    id: 'prices',
    title: { ar: 'الأسعار والتوفر', en: 'Prices and availability' },
    body: {
      ar: ['الأسعار والتوفر بتجيلنا من المحلات وممكن تتغيّر. السعر النهائي هو اللي بيظهر لك قبل إرسال الطلب. لو المحل غيّر السعر أو المنتج خلص، هنتواصل معاك قبل ما نكمّل.'],
      en: ['Prices and availability come from the shops and may change. The final price is the one shown before you send the order. If a shop changes a price or an item runs out, we will contact you before continuing.'],
    },
  },
  {
    id: 'orders',
    title: { ar: 'الطلب والدفع عند الاستلام', en: 'Ordering and cash on delivery' },
    body: {
      ar: [
        'إرسال الطلب هو طلب شراء، ومش بيتأكد إلا بعد موافقة المحل. الدفع نقدًا عند الاستلام.',
        'ممكن نتصل بيك لتأكيد الطلب، خصوصًا الطلبات الكبيرة. ونقدر نلغي الطلبات اللي بيانتها غير صحيحة أو اللي شكلها وهمي أو مكرر.',
      ],
      en: [
        'Sending an order is a purchase request and is confirmed only after the shop accepts it. Payment is in cash on delivery.',
        'We may call you to confirm an order, especially large ones. We may cancel orders with incorrect details or that appear fake or duplicated.',
      ],
    },
  },
  {
    id: 'delivery',
    title: { ar: 'التوصيل والاسترجاع', en: 'Delivery and returns' },
    body: {
      ar: ['كل محل بيوصّل شحنته برسوم ومواعيد خاصة بيه، فطلبك ممكن يتقسّم لأكتر من شحنة. شروط الاستبدال والاسترجاع بتحددها المحلات، وإحنا بنساعدك تتواصل معاهم.'],
      en: ['Each shop delivers its own shipment with its own fee and timing, so one order may be split into several shipments. Exchange and return terms are set by the shops, and we help you reach them.'],
    },
  },
  {
    id: 'ai',
    title: { ar: 'المساعد الذكي', en: 'The AI assistant' },
    body: {
      ar: ['المساعد بيقترح منتجات وأسعار وممكن يغلط. راجع السعر والمواصفات في صفحة المنتج، وتأكد من توافق القطعة مع مشروعك (الجهد، التيار، الأطراف) قبل الشراء. مفيش في ردوده نصيحة هندسية أو أمان ملزمة.'],
      en: ['The assistant suggests products and prices and can be wrong. Check the price and specifications on the product page, and make sure the part suits your project (voltage, current, pinout) before buying. Its answers are not binding engineering or safety advice.'],
    },
  },
  {
    id: 'use',
    title: { ar: 'الاستخدام المسموح', en: 'Acceptable use' },
    body: {
      ar: ['ممنوع: إرسال طلبات وهمية، جمع بيانات الموقع آليًا بشكل مكثّف، محاولة اختراقه أو تعطيله، أو رفع محتوى مسيء أو ضار.'],
      en: ['Not allowed: sending fake orders, bulk automated collection of the site\'s data, attempting to break into or disrupt it, or uploading abusive or harmful content.'],
    },
  },
  {
    id: 'liability',
    title: { ar: 'حدود المسؤولية', en: 'Limits of liability' },
    body: {
      ar: ['بقدر ما يسمح القانون، مش مسؤولين عن جودة المنتجات أو تأخير التوصيل من المحلات، ولا عن أي خسارة غير مباشرة ناتجة عن استخدام الموقع. ده مش بيمس حقوقك القانونية كمستهلك.'],
      en: ['To the extent the law allows, we are not responsible for product quality or delivery delays by the shops, or for indirect losses from using the site. This does not affect your legal rights as a consumer.'],
    },
  },
  {
    id: 'law',
    title: { ar: 'القانون الواجب التطبيق', en: 'Governing law' },
    body: {
      ar: ['بتخضع الشروط دي للقانون المصري، واختصاص المحاكم المصرية.'],
      en: ['These terms are governed by Egyptian law and the Egyptian courts.'],
    },
  },
  {
    id: 'changes',
    title: { ar: 'التعديلات', en: 'Changes' },
    body: {
      ar: ['ممكن نحدّث الشروط، وتاريخ آخر تحديث بيظهر في أول الصفحة. استمرارك في استخدام الموقع بعد التحديث معناه موافقتك.'],
      en: ['We may update these terms; the date at the top shows the latest version. Continuing to use the site after an update means you accept it.'],
    },
  },
];
