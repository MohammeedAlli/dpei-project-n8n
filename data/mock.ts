import type { Category, Shop, Product, Offer, Settings } from './types';

export const MOCK_SETTINGS: Settings = {
  support_whatsapp: '201001234567',
  site_name_ar: 'سوق الإلكترونيات',
  site_name_en: 'Electronics Souk',
};

export const CATEGORIES: Category[] = [
  { id: 'cat-mcu', slug: 'microcontrollers', name_en: 'Microcontrollers', name_ar: 'الميكروكونترولر', icon: 'Cpu', sort_order: 1 },
  { id: 'cat-sensors', slug: 'sensors', name_en: 'Sensors', name_ar: 'حساسات', icon: 'Gauge', sort_order: 2 },
  { id: 'cat-motors', slug: 'motors', name_en: 'Motors & Drivers', name_ar: 'موتورات ودريفرات', icon: 'Cog', sort_order: 3 },
  { id: 'cat-passive', slug: 'passive', name_en: 'Passive Components', name_ar: 'مكونات سلبية', icon: 'Circle', sort_order: 4 },
  { id: 'cat-modules', slug: 'modules', name_en: 'Modules & Boards', name_ar: 'موديولات ولوحات', icon: 'CircuitBoard', sort_order: 5 },
  { id: 'cat-power', slug: 'power', name_en: 'Power & Batteries', name_ar: 'طاقة وبطاريات', icon: 'BatteryCharging', sort_order: 6 },
];

export const SHOPS: Shop[] = [
  { id: 'shop-1', name: 'Future Electronics', slug: 'future-electronics', is_partner: true, commission_rate: 5, delivery_fee: 40, free_delivery_threshold: 500, delivery_days_text: '2-3 أيام', contact_whatsapp: '201001234567', external_url: null, logo_url: null, is_active: true },
  { id: 'shop-2', name: 'Raya Store', slug: 'raya-store', is_partner: true, commission_rate: 6, delivery_fee: 35, free_delivery_threshold: 400, delivery_days_text: '1-2 أيام', contact_whatsapp: '201011234567', external_url: null, logo_url: null, is_active: true },
  { id: 'shop-3', name: 'ElectroMa3had', slug: 'electroma3had', is_partner: true, commission_rate: 4, delivery_fee: 45, free_delivery_threshold: 600, delivery_days_text: '3-4 أيام', contact_whatsapp: '201021234567', external_url: null, logo_url: null, is_active: true },
  { id: 'shop-4', name: 'Arduino Egypt', slug: 'arduino-egypt', is_partner: true, commission_rate: 7, delivery_fee: 30, free_delivery_threshold: 350, delivery_days_text: '1-3 أيام', contact_whatsapp: '201031234567', external_url: 'https://example.com/arduino-egypt', logo_url: null, is_active: true },
  { id: 'shop-5', name: 'E-Components', slug: 'e-components', is_partner: true, commission_rate: 5, delivery_fee: 50, free_delivery_threshold: 700, delivery_days_text: '2-4 أيام', contact_whatsapp: '201041234567', external_url: null, logo_url: null, is_active: true },
  { id: 'shop-6', name: 'Giza Electronics', slug: 'giza-electronics', is_partner: true, commission_rate: 6, delivery_fee: 40, free_delivery_threshold: 500, delivery_days_text: '2-3 أيام', contact_whatsapp: '201051234567', external_url: null, logo_url: null, is_active: true },
  { id: 'shop-7', name: 'Delta Tech', slug: 'delta-tech', is_partner: false, commission_rate: 0, delivery_fee: 0, free_delivery_threshold: 0, delivery_days_text: null, contact_whatsapp: null, external_url: 'https://example.com/delta-tech', logo_url: null, is_active: true },
  { id: 'shop-8', name: 'Alexandria Components', slug: 'alex-components', is_partner: false, commission_rate: 0, delivery_fee: 0, free_delivery_threshold: 0, delivery_days_text: null, contact_whatsapp: null, external_url: 'https://example.com/alex-components', logo_url: null, is_active: true },
  { id: 'shop-9', name: 'Cairo Robotics', slug: 'cairo-robotics', is_partner: true, commission_rate: 5, delivery_fee: 35, free_delivery_threshold: 450, delivery_days_text: '1-2 أيام', contact_whatsapp: '201061234567', external_url: null, logo_url: null, is_active: true },
  { id: 'shop-10', name: 'Upper Egypt Electronics', slug: 'upper-egypt-electronics', is_partner: false, commission_rate: 0, delivery_fee: 0, free_delivery_threshold: 0, delivery_days_text: null, contact_whatsapp: null, external_url: 'https://example.com/upper-egypt', logo_url: null, is_active: true },
];

const now = new Date().toISOString();
const minutesAgo = (m: number) => new Date(Date.now() - m * 60 * 1000).toISOString();

const p = (
  id: string, name_en: string, name_ar: string, brand: string, catId: string,
  sku: string, desc_en: string, desc_ar: string,
  specs: Record<string, string>, createdMinAgo: number,
): Product => ({
  id,
  name_en,
  name_ar,
  sku,
  brand,
  category_id: catId,
  description_en: desc_en,
  description_ar: desc_ar,
  image_url: null,
  specs,
  created_at: minutesAgo(createdMinAgo + 1000),
  updated_at: minutesAgo(createdMinAgo),
});

export const PRODUCTS: Product[] = [
  // Microcontrollers (10)
  p('prod-1', 'Arduino Uno R3', 'أردوينو أونو R3', 'Arduino', 'cat-mcu', 'ARD-UNO-R3',
    'Classic Arduino Uno R3 development board with ATmega328P microcontroller.',
    'لوحة تطوير أردوينو أونو R3 الكلاسيكية بميكروكونترولر ATmega328P.',
    { 'Microcontroller': 'ATmega328P', 'Clock Speed': '16 MHz', 'Flash Memory': '32 KB', 'Digital I/O': '14', 'Analog Inputs': '6' }, 5),
  p('prod-2', 'Arduino Nano V3', 'أردوينو نانو V3', 'Arduino', 'cat-mcu', 'ARD-NANO-V3',
    'Compact Arduino Nano board, USB programmable, breadboard-friendly.',
    'لوحة أردوينو نانو صغيرة، قابلة للبرمجة عبر USB ومناسبة للبريدبورد.',
    { 'Microcontroller': 'ATmega328P', 'Clock Speed': '16 MHz', 'Flash Memory': '32 KB', 'Digital I/O': '22', 'Analog Inputs': '8' }, 10),
  p('prod-3', 'Arduino Mega 2560', 'أردوينو ميجا 2560', 'Arduino', 'cat-mcu', 'ARD-MEGA-2560',
    'High-performance Arduino Mega 2560 with 54 digital I/O pins.',
    'لوحة أردوينو ميجا 2560 عالية الأداء بـ 54 طرف إدخال/إخراج رقمي.',
    { 'Microcontroller': 'ATmega2560', 'Clock Speed': '16 MHz', 'Flash Memory': '256 KB', 'Digital I/O': '54', 'Analog Inputs': '16' }, 15),
  p('prod-4', 'ESP32 DevKit V1', 'لوحة ESP32 DevKit V1', 'Espressif', 'cat-mcu', 'ESP32-DEV-V1',
    'Dual-core ESP32 development board with WiFi and Bluetooth.',
    'لوحة تطوير ESP32 بمعالج ثنائي النواة مع WiFi و Bluetooth.',
    { 'CPU': 'Xtensa Dual-core 240MHz', 'Flash': '4 MB', 'RAM': '520 KB', 'WiFi': '802.11 b/g/n', 'Bluetooth': '4.2 BLE' }, 3),
  p('prod-5', 'ESP8266 NodeMCU V3', 'لوحة ESP8266 NodeMCU V3', 'Espressif', 'cat-mcu', 'ESP8266-NODE-V3',
    'WiFi-enabled ESP8266 NodeMCU board with CH340 USB chip.',
    'لوحة ESP8266 NodeMCU بشبكة WiFi ورقاقة USB CH340.',
    { 'CPU': 'Tensilica L106 80MHz', 'Flash': '4 MB', 'RAM': '80 KB', 'WiFi': '802.11 b/g/n' }, 8),
  p('prod-6', 'Raspberry Pi 4 Model B 4GB', 'راسبيري باي 4 موديل B بسعة 4 جيجا', 'Raspberry Pi', 'cat-mcu', 'RPi4-B-4GB',
    'Raspberry Pi 4 with 4GB RAM, dual micro HDMI, Gigabit Ethernet.',
    'راسبيري باي 4 بسعة 4 جيجا رام، HDMI مزدوج، إيثرنت جيجابت.',
    { 'CPU': 'Broadcom BCM2711 Quad-core 1.5GHz', 'RAM': '4 GB', 'USB': '2x USB 3.0 + 2x USB 2.0', 'Network': 'Gigabit Ethernet + WiFi 5' }, 20),
  p('prod-7', 'STM32F103C8T6 Blue Pill', 'STM32F103C8T6 بلو بيل', 'STMicroelectronics', 'cat-mcu', 'STM32-BPILL',
    'STM32 ARM Cortex-M3 development board, compact and affordable.',
    'لوحة تطوير STM32 بمعالج ARM Cortex-M3، صغيرة الحجم واقتصادية.',
    { 'CPU': 'ARM Cortex-M3 72MHz', 'Flash': '64 KB', 'RAM': '20 KB', 'Pins': '37' }, 30),
  p('prod-8', 'Arduino Pro Mini 5V', 'أردوينو برو ميني 5V', 'Arduino', 'cat-mcu', 'ARD-PRO-MINI-5V',
    'Minimal Arduino Pro Mini 5V board for compact projects.',
    'لوحة أردوينو برو ميني 5V للمشاريع الصغيرة.',
    { 'Microcontroller': 'ATmega328P', 'Clock Speed': '16 MHz', 'Flash Memory': '32 KB', 'Digital I/O': '14' }, 45),
  p('prod-9', 'ESP32-S3 DevKit', 'لوحة ESP32-S3 DevKit', 'Espressif', 'cat-mcu', 'ESP32S3-DEV',
    'ESP32-S3 with AI acceleration and USB-OTG support.',
    'لوحة ESP32-S3 مع تسريع الذكاء الاصطناعي ودعم USB-OTG.',
    { 'CPU': 'Xtensa LX7 Dual-core 240MHz', 'Flash': '8 MB', 'PSRAM': '2 MB', 'WiFi': '802.11 b/g/n', 'USB': 'USB-OTG' }, 7),
  p('prod-10', 'Micro:bit V2', 'مايكرو بيت V2', 'BBC', 'cat-mcu', 'MBIT-V2',
    'BBC micro:bit V2 with speaker, microphone, and touch sensor.',
    'بي بي سي مايكرو بيت V2 بمكبر وميكروفون وحساس لمس.',
    { 'CPU': 'nRF52833 64MHz', 'RAM': '128 KB', 'Flash': '512 KB', 'Bluetooth': '5.0 BLE', 'LED Matrix': '5x5' }, 25),

  // Sensors (10)
  p('prod-11', 'DHT22 Temperature & Humidity Sensor', 'حساس حرارة ورطوبة DHT22', 'Aosong', 'cat-sensors', 'DHT22',
    'High-precision digital temperature and humidity sensor.',
    'حساس رقمي لقياس الحرارة والرطوبة بدقة عالية.',
    { 'Type': 'Digital', 'Temperature Range': '-40 to 80°C', 'Humidity Range': '0-100% RH', 'Accuracy': '±0.5°C' }, 12),
  p('prod-12', 'DS18B20 Waterproof Temperature Sensor', 'حساس حرارة DS18B20 مقاوم للماء', 'Dallas', 'cat-sensors', 'DS18B20-WP',
    'Waterproof 1-Wire temperature sensor probe with 1m cable.',
    'حساس حرارة 1-Wire مقاوم للماء بكابل 1 متر.',
    { 'Type': '1-Wire Digital', 'Range': '-55 to 125°C', 'Accuracy': '±0.5°C', 'Cable': '1 meter' }, 18),
  p('prod-13', 'HC-SR04 Ultrasonic Distance Sensor', 'حساس مسافة HC-SR04 بالموجات فوق الصوتية', 'Generic', 'cat-sensors', 'HC-SR04',
    'Ultrasonic ranging module for 2cm-400cm distance measurement.',
    'موديول قياس مسافة بالموجات فوق الصوتية من 2 سم لـ 400 سم.',
    { 'Range': '2-400 cm', 'Accuracy': '3 mm', 'Operating Voltage': '5V DC', 'Interface': 'Digital' }, 4),
  p('prod-14', 'MPU6050 Gyro + Accelerometer', 'جيروسكوب وأكسيليروميتر MPU6050', 'InvenSense', 'cat-sensors', 'MPU6050',
    '6-axis motion tracking device combining 3-axis gyro and accelerometer.',
    'جهاز تتبع حركة 6 محاور يجمع جيروسكوب 3 محاور وأكسيليروميتر.',
    { 'Gyro Range': '±250/500/1000/2000°/s', 'Accel Range': '±2/4/8/16g', 'Interface': 'I2C', 'Voltage': '3.3-5V' }, 6),
  p('prod-15', 'BME280 Pressure Humidity Temperature', 'حساس ضغط ورطوبة وحرارة BME280', 'Bosch', 'cat-sensors', 'BME280',
    'Precision sensor for humidity, pressure, and temperature.',
    'حساس دقيق لقياس الرطوبة والضغط والحرارة.',
    { 'Pressure Range': '300-1100 hPa', 'Temp Range': '-40 to 85°C', 'Interface': 'I2C/SPI', 'Accuracy': '±1 hPa' }, 14),
  p('prod-16', 'IR Infrared Obstacle Sensor', 'حساس عوائق بالأشعة تحت الحمراء', 'Generic', 'cat-sensors', 'IR-OBSTACLE',
    'Adjustable IR obstacle detection sensor module with comparator.',
    'موديول حساس عوائق بالأشعة تحت الحمراء قابل للضبط مع مقارن.',
    { 'Detection Range': '2-30 cm', 'Output': 'Digital (HIGH/LOW)', 'Voltage': '3.3-5V', 'Adjustable': 'Yes' }, 35),
  p('prod-17', 'Soil Moisture Sensor Module', 'موديول حساس رطوبة التربة', 'Generic', 'cat-sensors', 'SOIL-MOIST',
    'Analog and digital soil moisture sensor for plant monitoring.',
    'حساس رقمي وتماثلي لرطوبة التربة لمراقبة النباتات.',
    { 'Output': 'Analog + Digital', 'Operating Voltage': '3.3-5V', 'Probe': 'Corrosion-resistant' }, 40),
  p('prod-18', 'PIR Motion Sensor HC-SR501', 'حساس حركة PIR HC-SR501', 'Generic', 'cat-sensors', 'HC-SR501',
    'Passive infrared motion detector with adjustable sensitivity.',
    'كاشف حركة بالأشعة تحت الحمراء السلبية مع حساسية قابلة للضبط.',
    { 'Detection Range': '3-7 m', 'Delay Time': '5-200s adjustable', 'Voltage': '4.5-20V', 'Output': 'Digital HIGH/LOW' }, 8),
  p('prod-19', 'MQ-2 Gas Smoke Sensor', 'حساس غاز ودخان MQ-2', 'Winsensor', 'cat-sensors', 'MQ-2',
    'Combustible gas and smoke detector sensor module.',
    'حساس كاشف للغازات القابلة للاشتعال والدخان.',
    { 'Detection': 'LPG, Propane, Methane, Smoke', 'Output': 'Analog + Digital', 'Voltage': '5V', 'Preheat': '24-48h' }, 50),
  p('prod-20', 'LDR Light Sensor Module', 'موديول حساس ضوء LDR', 'Generic', 'cat-sensors', 'LDR-MOD',
    'Light dependent resistor module with analog and digital output.',
    'موديول مقاومة ضوئية بمخرج تماثلي ورقمي.',
    { 'Type': 'Photoresistor', 'Output': 'Analog + Digital', 'Voltage': '3.3-5V', 'Adjustable': 'Threshold via pot' }, 55),

  // Motors & Drivers (8)
  p('prod-21', 'SG90 Micro Servo Motor', 'موتور سيرفو صغير SG90', 'TowerPro', 'cat-motors', 'SG90',
    'Small and lightweight servo motor for robotics and RC projects.',
    'موتور سيرفو صغير وخفيف لمشاريع الروبوتات والـ RC.',
    { 'Torque': '1.8 kg-cm', 'Speed': '0.1s/60°', 'Voltage': '4.8-6V', 'Weight': '9g' }, 9),
  p('prod-22', 'L298N Dual H-Bridge Motor Driver', 'دريفر موتور L298N جسر H مزدوج', 'ST', 'cat-motors', 'L298N',
    'Dual H-bridge motor driver for two DC motors or one stepper.',
    'دريفر موتور جسر H مزدوج لموتورين DC أو موتور ستنب واحد.',
    { 'Channels': '2', 'Max Current': '2A per channel', 'Voltage': '5-35V', 'Logic Voltage': '5V' }, 11),
  p('prod-23', 'NEMA 17 Stepper Motor', 'موتور ستنب NEMA 17', 'Generic', 'cat-motors', 'NEMA17',
    'Standard NEMA 17 bipolar stepper motor for 3D printers and CNC.',
    'موتور ستنب NEMA 17 ثنائي القطب لطابعات 3D و CNC.',
    { 'Step Angle': '1.8°', 'Holding Torque': '4.4 kg-cm', 'Rated Current': '1.5A', 'Size': '42x42mm' }, 22),
  p('prod-24', 'A4988 Stepper Motor Driver', 'دريفر موتور ستنب A4988', 'Allegro', 'cat-motors', 'A4988',
    'Stepper motor driver module with adjustable current limiting.',
    'موديول دريفر موتور ستنب مع تحديد تيار قابل للضبط.',
    { 'Max Current': '2A', 'Microstepping': 'Up to 1/16', 'Voltage': '8-35V', 'Logic': '3.3/5V' }, 16),
  p('prod-25', '28BYJ-48 Stepper Motor + ULN2003', 'موتور ستنب 28BYJ-48 مع ULN2003', 'Generic', 'cat-motors', '28BYJ48-SET',
    '5V unipolar stepper motor with ULN2003 driver board.',
    'موتور ستنب أحادي القطب 5V مع لوحة دريفر ULN2003.',
    { 'Step Angle': '5.625°', 'Voltage': '5V', 'Gear Ratio': '1:64', 'Driver': 'ULN2003 included' }, 28),
  p('prod-26', 'DC Motor 12V 200RPM', 'موتور DC 12V 200 لفة/دقيقة', 'Generic', 'cat-motors', 'DC-12V-200',
    '12V DC geared motor with 200 RPM speed.',
    'موتور DC بمسننات 12V بسرعة 200 لفة/دقيقة.',
    { 'Voltage': '12V', 'Speed': '200 RPM', 'Torque': '2 kg-cm', 'Type': 'Geared' }, 33),
  p('prod-27', 'TB6600 Stepper Driver', 'دريفر موتور ستنب TB6600', 'Toshiba', 'cat-motors', 'TB6600',
    'High-current stepper motor driver up to 4A for CNC applications.',
    'دريفر موتور ستنب بتيار عالي حتى 4A لتطبيقات CNC.',
    { 'Max Current': '4A', 'Microstepping': 'Up to 1/32', 'Voltage': '8-42V', 'Cooling': 'Heatsink included' }, 42),
  p('prod-28', 'MG996R Metal Gear Servo', 'موتور سيرفو MG996R بمسننات معدنية', 'TowerPro', 'cat-motors', 'MG996R',
    'High-torque metal gear servo for heavy-duty applications.',
    'موتور سيرفو عزم عالي بمسننات معدنية للتطبيقات الثقيلة.',
    { 'Torque': '11 kg-cm', 'Speed': '0.17s/60°', 'Voltage': '4.8-7.2V', 'Gear': 'Metal' }, 19),

  // Passive Components (10)
  p('prod-29', 'Resistor Kit 1/4W 600 Values', 'طقم مقاومات 1/4W 600 قيمة', 'Generic', 'cat-passive', 'RES-KIT-600',
    'Complete resistor kit with 600 different values, 30 pieces each.',
    'طقم مقاومات كامل بـ 600 قيمة مختلفة، 30 قطعة لكل قيمة.',
    { 'Power': '1/4W', 'Tolerance': '±5%', 'Values': '600', 'Pieces': '18000' }, 60),
  p('prod-30', 'Ceramic Capacitor Assortment Kit', 'طقم مكثفات سيراميك متنوع', 'Generic', 'cat-passive', 'CER-CAP-KIT',
    'Ceramic capacitor assortment with common values 10pF to 1uF.',
    'طقم مكثفات سيراميك بقيم شائعة من 10pF إلى 1uF.',
    { 'Type': 'Ceramic', 'Range': '10pF - 1uF', 'Pieces': '600', 'Voltage': '50V' }, 65),
  p('prod-31', 'Electrolytic Capacitor Kit', 'طقم مكثفات إلكتروليت', 'Generic', 'cat-passive', 'ELEC-CAP-KIT',
    'Electrolytic capacitor assortment from 0.1uF to 10000uF.',
    'طقم مكثفات إلكتروليت من 0.1uF إلى 10000uF.',
    { 'Type': 'Electrolytic', 'Range': '0.1uF - 10000uF', 'Pieces': '300', 'Voltage': '10-50V' }, 70),
  p('prod-32', 'LED Kit 5mm Assorted 100pcs', 'طقم ليدات 5mm متنوع 100 قطعة', 'Generic', 'cat-passive', 'LED-5MM-100',
    'Mixed color 5mm LED assortment with red, green, blue, yellow, white.',
    'طقم ليدات 5mm بألوان متنوعة: أحمر، أخضر، أزرق، أصفر، أبيض.',
    { 'Diameter': '5mm', 'Colors': '5', 'Pieces': '100', 'Forward Voltage': '1.8-3.3V' }, 5),
  p('prod-33', '10mm LED Red 50pcs', 'ليد أحمر 10mm 50 قطعة', 'Generic', 'cat-passive', 'LED-10R-50',
    'High-brightness 10mm red LEDs, pack of 50.',
    'ليدات حمراء عالية السطوع 10mm، عبوة 50 قطعة.',
    { 'Diameter': '10mm', 'Color': 'Red', 'Pieces': '50', 'Wavelength': '620-625nm' }, 38),
  p('prod-34', 'Breadboard 830 Points', 'بريدبورد 830 نقطة', 'Generic', 'cat-passive', 'BB-830',
    'Full-size solderless breadboard with 830 tie points.',
    'بريدبورد كبير بدون لحام بـ 830 نقطة توصيل.',
    { 'Points': '830', 'Size': '165x55mm', 'Type': 'Solderless', 'Power Rails': '4' }, 2),
  p('prod-35', 'Jumper Wire Kit 40pcs', 'طقم أسلاك توصيل 40 قطعة', 'Generic', 'cat-passive', 'JMP-40',
    'Male-to-male jumper wires for breadboard connections, 40 pieces.',
    'أسلاك توصيل ذكر-ذكر للبريدبورد، 40 قطعة.',
    { 'Type': 'M-M', 'Length': '20cm', 'Pieces': '40', 'Colors': '10' }, 3),
  p('prod-36', 'Tactile Push Button 6x6mm 50pcs', 'أزرار ضغط 6x6mm 50 قطعة', 'Generic', 'cat-passive', 'BTN-6X6-50',
    '6x6mm tactile push buttons, pack of 50 mixed styles.',
    'أزرار ضغط 6x6mm، عبوة 50 قطعة بأنماط متنوعة.',
    { 'Size': '6x6mm', 'Pieces': '50', 'Type': 'Tactile', 'Height': '4.3/5/7/8mm' }, 27),
  p('prod-37', 'DIODE 1N4007 50pcs', 'دايود 1N4007 50 قطعة', 'Generic', 'cat-passive', '1N4007-50',
    'General purpose rectifier diodes 1N4007, pack of 50.',
    'دايودات تنظيم عامة 1N4007، عبوة 50 قطعة.',
    { 'Type': 'Rectifier', 'Max Current': '1A', 'Max Voltage': '1000V', 'Pieces': '50' }, 48),
  p('prod-38', 'Transistor BC547 20pcs', 'ترانزستور BC547 20 قطعة', 'NXP', 'cat-passive', 'BC547-20',
    'NPN general purpose transistors BC547, pack of 20.',
    'ترانزستورات NPN عامة BC547، عبوة 20 قطعة.',
    { 'Type': 'NPN', 'Max Current': '100mA', 'Max Voltage': '45V', 'Pieces': '20' }, 52),

  // Modules & Boards (12)
  p('prod-39', '16x2 LCD with I2C Module', 'شاشة LCD 16x2 مع موديول I2C', 'Generic', 'cat-modules', 'LCD1602-I2C',
    '16x2 character LCD display with I2C backpack for easy wiring.',
    'شاشة LCD حروف 16x2 مع موديول I2C لتوصيل سهل.',
    { 'Display': '16x2 Characters', 'Interface': 'I2C', 'Backlight': 'Blue', 'Address': '0x27/0x3F' }, 13),
  p('prod-40', '0.96 inch OLED Display I2C', 'شاشة OLED 0.96 بوصة I2C', 'Solomon', 'cat-modules', 'OLED-096-I2C',
    '0.96" monochrome OLED display with SSD1306 driver, I2C interface.',
    'شاشة OLED أبيض وأسود 0.96 بوصة بدريفر SSD1306، واجهة I2C.',
    { 'Resolution': '128x64', 'Driver': 'SSD1306', 'Interface': 'I2C', 'Size': '0.96 inch' }, 7),
  p('prod-41', 'Relay Module 5V 4-Channel', 'موديول ريلاي 5V 4 قنوات', 'Generic', 'cat-modules', 'RELAY-4CH-5V',
    '4-channel 5V relay module with optocoupler isolation.',
    'موديول ريلاي 4 قنوات 5V مع عزل أوبتوكابلر.',
    { 'Channels': '4', 'Trigger': 'Active LOW', 'Max Switching': '10A 250VAC', 'Isolation': 'Optocoupler' }, 10),
  p('prod-42', 'RFID Module RC522', 'موديول RFID RC522', 'NXP', 'cat-modules', 'RC522',
    'RFID reader/writer module based on MFRC522 chip, 13.56MHz.',
    'موديول قارئ/كاتب RFID بدائرة MFRC522، 13.56 ميجاهرتز.',
    { 'Chip': 'MFRC522', 'Frequency': '13.56 MHz', 'Interface': 'SPI', 'Voltage': '3.3V' }, 17),
  p('prod-43', 'NeoPixel Ring 12 LEDs', 'حلقة NeoPixel 12 ليد', 'Adafruit', 'cat-modules', 'NEO-RING-12',
    'WS2812B addressable LED ring with 12 LEDs for decorative lighting.',
    'حلقة ليدات WS2812B قابلة للعنونة بـ 12 ليد للإضاءة الزخرفية.',
    { 'LEDs': '12', 'Chip': 'WS2812B', 'Voltage': '5V', 'Diameter': '37mm' }, 21),
  p('prod-44', 'MicroSD Card Module', 'موديول كارت MicroSD', 'Generic', 'cat-modules', 'SD-MOD',
    'SPI microSD card reader module for Arduino and ESP boards.',
    'موديول قارئ كارت MicroSD بـ SPI لأردوينو و ESP.',
    { 'Interface': 'SPI', 'Voltage': '3.3V (5V tolerant)', 'Support': 'MicroSD up to 32GB' }, 44),
  p('prod-45', 'MAX7219 8x8 LED Matrix', 'ماتريكس ليد 8x8 MAX7219', 'Maxim', 'cat-modules', 'MAX7219-8X8',
    '8x8 dot LED matrix display module with MAX7219 driver.',
    'موديول شاشة ماتريكس ليد 8x8 بدريفر MAX7219.',
    { 'Size': '8x8', 'Driver': 'MAX7219', 'Interface': 'SPI', 'Color': 'Red' }, 26),
  p('prod-46', 'Buzzer Module Active 5V', 'موديول بازر نشط 5V', 'Generic', 'cat-modules', 'BUZZ-ACT-5V',
    'Active buzzer module that beeps with just DC voltage, no signal needed.',
    'موديول بازر نشط يصدر صوت بتيار DC مباشر، بدون إشارة.',
    { 'Type': 'Active', 'Voltage': '5V', 'Frequency': '2.3 kHz', 'Sound': '85 dB' }, 31),
  p('prod-47', 'IR Remote + Receiver Kit', 'طريموت IR + مستقبل', 'Generic', 'cat-modules', 'IR-REMOTE-KIT',
    'Infrared remote control and receiver kit for DIY projects.',
    'طريموت أشعة تحت الحمراء ومستقبل لمشاريع DIY.',
    { 'Remote': '21 keys', 'Receiver': 'VS1838B', 'Frequency': '38 kHz', 'Protocol': 'NEC' }, 36),
  p('prod-48', 'PCA9685 16-Channel PWM Driver', 'دريفر PWM 16 قناة PCA9685', 'NXP', 'cat-modules', 'PCA9685',
    'I2C-controlled 16-channel 12-bit PWM driver for servos and LEDs.',
    'دريفر PWM 16 قناة 12-bit بتحكم I2C للسيرفوهات والليدات.',
    { 'Channels': '16', 'Resolution': '12-bit', 'Interface': 'I2C', 'Max PWM': '1600Hz' }, 41),
  p('prod-49', '74HC595 Shift Register 10pcs', 'شيفت ريجستر 74HC595 10 قطعة', 'TI', 'cat-modules', '74HC595-10',
    '8-bit shift register IC for expanding output pins, pack of 10.',
    'شيفت ريجستر 8-bit لتوسيع أطراف الإخراج، عبوة 10 قطعة.',
    { 'Type': '8-bit Shift Register', 'Pieces': '10', 'Voltage': '2-6V', 'Package': 'DIP-16' }, 46),
  p('prod-50', 'TM1637 4-Digit Display Module', 'شاشة 4 أرقام TM1637', 'Titan Micro', 'cat-modules', 'TM1637-4D',
    '4-digit 7-segment display module with TM1637 driver, 2-pin interface.',
    'موديول شاشة 7 سيجمنت 4 أرقام بدريفر TM1637، واجهة طرفين.',
    { 'Display': '4-digit 7-segment', 'Driver': 'TM1637', 'Interface': '2-pin serial', 'Color': 'Red' }, 29),

  // Power & Batteries (10)
  p('prod-51', '18650 Lithium Battery 3000mAh', 'بطارية ليثيوم 18650 سعة 3000mAh', 'Samsung', 'cat-power', '18650-3000',
    'Rechargeable 18650 Li-ion battery cell, 3.7V 3000mAh.',
    'بطارية ليثيوم rechargeable 18605، 3.7V سعة 3000mAh.',
    { 'Type': 'Li-ion', 'Capacity': '3000 mAh', 'Voltage': '3.7V', 'Max Discharge': '10A' }, 15),
  p('prod-52', 'TP4056 Charging Module', 'موديول شحن TP4056', 'NanJing', 'cat-power', 'TP4056',
    'Li-ion battery charging module with micro-USB and protection.',
    'موديول شحن بطارية ليثيوم مع micro-USB وحماية.',
    { 'Chip': 'TP4056', 'Input': '5V Micro-USB', 'Charge Current': '1A', 'Protection': 'Overcharge/Discharge' }, 9),
  p('prod-53', 'LM2596 Buck Converter Module', 'موديول محول LM2596 Step-Down', 'Texas Instruments', 'cat-power', 'LM2596-BUCK',
    'Adjustable step-down voltage regulator module, 3A output.',
    'موديول محول جهد step-down قابل للضبط، إخراج 3A.',
    { 'Input': '4-40V', 'Output': '1.5-37V adjustable', 'Max Current': '3A', 'Efficiency': 'Up to 92%' }, 12),
  p('prod-54', 'XL6009 Boost Converter Module', 'موديول محول XL6009 Step-Up', 'XLSEMI', 'cat-power', 'XL6009-BOOST',
    'Adjustable step-up voltage booster module, up to 35V output.',
    'موديول محول جهد step-up قابل للضبط، إخراج حتى 35V.',
    { 'Input': '3.6-32V', 'Output': '5-35V adjustable', 'Max Current': '4A (peak)', 'Efficiency': 'Up to 94%' }, 23),
  p('prod-55', '9V Battery Snap Connector 10pcs', 'كابلات بطارية 9V 10 قطعة', 'Generic', 'cat-power', '9V-SNAP-10',
    '9V battery snap clip connectors, pack of 10.',
    'كابلات توصيل بطارية 9V، عبوة 10 قطع.',
    { 'Type': 'Snap clip', 'Pieces': '10', 'Wire': '15cm', 'Gauge': '26 AWG' }, 47),
  p('prod-56', 'Solar Panel 5V 1W', 'لوح شمسي 5V 1W', 'Generic', 'cat-power', 'SOLAR-5V-1W',
    'Mini solar panel for small DIY electronics projects.',
    'لوح شمسي صغير لمشاريع الإلكترونيات الصغيرة.',
    { 'Power': '1W', 'Voltage': '5V', 'Current': '200mA', 'Size': '80x60mm' }, 34),
  p('prod-57', 'Power Supply 12V 2A Adapter', 'محول طاقة 12V 2A', 'Generic', 'cat-power', 'PS-12V-2A',
    '12V 2A DC power supply adapter with 5.5x2.1mm barrel jack.',
    'محول طاقة DC 12V 2A بمقبس 5.5x2.1mm.',
    { 'Output': '12V DC', 'Current': '2A', 'Input': '100-240V AC', 'Plug': '5.5x2.1mm' }, 18),
  p('prod-58', 'Battery Holder 4x AA', 'حامل بطارية 4x AA', 'Generic', 'cat-power', 'BAT-HOLD-4AA',
    '4x AA battery holder with on/off switch and leads.',
    'حامل 4 بطاريات AA مع مفتاح تشغيل/إيقاف وأسلاك.',
    { 'Capacity': '4x AA', 'Output': '6V', 'Switch': 'Yes', 'Wire': '15cm' }, 39),
  p('prod-59', 'USB to TTL Converter CP2102', 'محول USB إلى TTL CP2102', 'Silicon Labs', 'cat-power', 'CP2102-USB-TTL',
    'USB to TTL serial converter module with CP2102 chip.',
    'موديول محول USB إلى TTL تسلسلي بدائرة CP2102.',
    { 'Chip': 'CP2102', 'Interface': 'USB to UART', 'Voltage': '3.3V/5V selectable', 'Pins': 'TX, RX, VCC, GND' }, 24),
  p('prod-60', 'DC Jack to Screw Terminal', 'مقبس DC إلى طرف برغي', 'Generic', 'cat-power', 'DC-JACK-TERM',
    'DC power jack adapter to screw terminal block for easy wiring.',
    'محول مقبس طاقة DC إلى طرف برغي للتوصيل السهل.',
    { 'Jack': '5.5x2.1mm', 'Type': 'Screw terminal', 'Current': 'Up to 5A', 'Mount': 'Panel mount' }, 53),
];

// Generate offers for each product from multiple shops
function generateOffers(): Offer[] {
  const offers: Offer[] = [];
  const partnerShops = SHOPS.filter((s) => s.is_partner);
  const nonPartnerShops = SHOPS.filter((s) => !s.is_partner);
  let offerIdx = 1;

  for (const product of PRODUCTS) {
    // Each product gets 2-4 partner offers + 0-2 non-partner offers
    const numPartner = 2 + Math.floor((offerIdx % 3));
    const numNonPartner = offerIdx % 2 === 0 ? 1 : 2;
    const basePrice = 50 + (offerIdx * 37) % 800;

    const shuffledPartners = [...partnerShops].sort(() => {
      // Deterministic pseudo-random based on offerIdx
      const h = (offerIdx * 2654435761) & 0xffffffff;
      return ((h >>> 0) % 3) - 1;
    });
    const shuffledNonPartners = [...nonPartnerShops].sort(() => {
      const h = (offerIdx * 40503 + 1) & 0xffffffff;
      return ((h >>> 0) % 3) - 1;
    });

    const usedShops = new Set<string>();
    const allOffers: { shopId: string; price: number; inStock: boolean }[] = [];

    for (let i = 0; i < numPartner && i < shuffledPartners.length; i++) {
      const shop = shuffledPartners[i];
      if (usedShops.has(shop.id)) continue;
      usedShops.add(shop.id);
      const priceVar = 1 + ((offerIdx * 7 + i * 13) % 30) / 100;
      allOffers.push({
        shopId: shop.id,
        price: Math.round(basePrice * priceVar),
        inStock: (offerIdx + i) % 7 !== 0,
      });
    }

    for (let i = 0; i < numNonPartner && i < shuffledNonPartners.length; i++) {
      const shop = shuffledNonPartners[i];
      if (usedShops.has(shop.id)) continue;
      usedShops.add(shop.id);
      const priceVar = 0.9 + ((offerIdx * 11 + i * 17) % 20) / 100;
      allOffers.push({
        shopId: shop.id,
        price: Math.round(basePrice * priceVar),
        inStock: (offerIdx + i + 3) % 5 !== 0,
      });
    }

    // Sort by price so first is cheapest
    allOffers.sort((a, b) => a.price - b.price);

    for (const o of allOffers) {
      offers.push({
        id: `offer-${offerIdx}`,
        product_id: product.id,
        shop_id: o.shopId,
        price: o.price,
        in_stock: o.inStock,
        external_product_url: null,
        last_updated_at: minutesAgo((offerIdx * 3) % 120),
        created_at: now,
        updated_at: now,
      });
      offerIdx++;
    }
  }

  return offers;
}

export const OFFERS: Offer[] = generateOffers();
