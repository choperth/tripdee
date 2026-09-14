/**
 * TripDee JSON-LD Structured Data for AEO (Answer Engine Optimization) & Rich Search
 * Tailored for Google Search, AI Overviews, Perplexity, Claude, and ChatGPT Web Search.
 */

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tripdee.co';

export function getStructuredData() {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${BASE_URL}/#organization`,
    name: 'TripDee (ทริปดี)',
    alternateName: ['TripDee Chiang Mai', 'ทริปดี เชียงใหม่'],
    url: BASE_URL,
    logo: `${BASE_URL}/favicon.ico`,
    description:
      'แพลตฟอร์มศูนย์รวมรถตู้ VIP พร้อมคนขับ รถเช่าขับเอง SUV และที่พักแนะนำในจังหวัดเชียงใหม่ ติดต่อคนขับตรง ไม่บวกค่านายหน้า ปลอดภัย ตรวจสอบเอกสารคนขับทุกคน พร้อมบริการลูกค้าองค์กรและออกใบกำกับภาษีเต็มรูปแบบ',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+66-81-234-5678',
      contactType: 'customer service',
      areaServed: 'TH',
      availableLanguage: ['Thai', 'English', 'Chinese'],
    },
    sameAs: ['https://line.me/R/ti/p/@tripdee'],
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Chiang Mai',
      addressRegion: 'Chiang Mai',
      addressCountry: 'TH',
    },
  };

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'TravelAgency',
    '@id': `${BASE_URL}/#localbusiness`,
    name: 'TripDee รถตู้เชียงใหม่ VIP & ที่พักคุณภาพ',
    image:
      'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
    url: BASE_URL,
    telephone: '+66-81-234-5678',
    priceRange: '฿1,800 - ฿3,500',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Chiang Mai',
      addressRegion: 'Chiang Mai',
      postalCode: '50000',
      addressCountry: 'TH',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 18.7883,
      longitude: 98.9853,
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
      ],
      opens: '00:00',
      closes: '23:59',
    },
    areaServed: [
      {
        '@type': 'AdministrativeArea',
        name: 'Chiang Mai',
      },
      {
        '@type': 'AdministrativeArea',
        name: 'Chiang Rai',
      },
      {
        '@type': 'AdministrativeArea',
        name: 'Mae Hong Son',
      },
    ],
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${BASE_URL}/#website`,
    url: BASE_URL,
    name: 'TripDee ทริปดี',
    description: 'ทริปดีๆ เริ่มต้นที่นี่ รวมรถตู้ VIP เชียงใหม่ และที่พักคุณภาพ',
    inLanguage: ['th-TH', 'en-US', 'zh-CN'],
    potentialAction: {
      '@type': 'SearchAction',
      target: `${BASE_URL}/?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  // High-value FAQ Schema for AI Search / Answer Engine Optimization (AEO)
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'เช่ารถตู้ VIP พร้อมคนขับในเชียงใหม่ผ่าน TripDee คิดราคาอย่างไร?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'ราคากลางมาตรฐานรถตู้ VIP พร้อมคนขับในเชียงใหม่เริ่มต้นที่ประมาณ 1,800 - 2,000 บาท/วัน สำหรับเส้นทางในเมือง/รอบเมือง/สนามบิน, 2,000 - 2,300 บาท/วัน สำหรับดอยระดับกลาง (ม่อนแจ่ม แม่ริม แม่กำปอง), และ 2,300 - 2,600 บาท/วัน สำหรับดอยสูง (ดอยอินทนนท์ อ่างขาง) โดยลูกค้าติดต่อตกลงและโทรหาคนขับตรงโดยไม่บวกค่านายหน้า',
        },
      },
      {
        '@type': 'Question',
        name: 'TripDee มีการตรวจสอบความปลอดภัยของคนขับรถอย่างไร?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'คนขับที่ได้รับตรา TripDee Verified ทุกคันต้องผ่านการตรวจเอกสารใบขับขี่สาธารณะ (ท.2/ท.3) ตรวจสภาพรถประจำปี (ตรอ.) มีประกันภัยคุ้มครองผู้โดยสาร และมีประวัติการขับขี่ปลอดภัย',
        },
      },
      {
        '@type': 'Question',
        name: 'สามารถขอใบเสนอราคาและใบกำกับภาษีเต็มรูปแบบสำหรับบริษัทหรือหน่วยงานได้ไหม?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'ได้ TripDee มีระบบสำหรับลูกค้าองค์กร หน่วยงานราชการ และบริษัทเอกชน สามารถขอใบเสนอราคาล่วงหน้า ออกใบกำกับภาษี/ใบเสร็จรับเงินเต็มรูปแบบ พร้อมรองรับการหักภาษี ณ ที่จ่าย 3% สำหรับการจัดสัมมนาหรือทริปดูงาน',
        },
      },
      {
        '@type': 'Question',
        name: 'ที่พักแนะนำบน TripDee มีสิทธิพิเศษอะไรบ้าง?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'TripDee คัดสรรที่พักและพูลวิลล่าพันธมิตรคุณภาพ เช่น พูลวิลล่าม่อนแจ่ม รีสอร์ทแม่ริม โดยลูกค้าที่เดินทางกับ TripDee จะได้รับส่วนลดพิเศษหรือสิทธิประโยชน์เพิ่มเติมเมื่อจองตรงกับทางที่พัก',
        },
      },
    ],
  };

  return {
    organizationSchema,
    localBusinessSchema,
    websiteSchema,
    faqSchema,
  };
}
