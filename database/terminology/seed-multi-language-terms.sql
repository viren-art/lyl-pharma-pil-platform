-- Seed multi-language pharmaceutical terminology for Thai (FDA Thailand) and Vietnamese (DAV)
-- This extends the existing translation_memory table with market-specific glossaries

-- Thai (FDA Thailand) pharmaceutical terminology
INSERT INTO translation_memory (source_term, target_term, source_language, target_language, market_applicability, approved_by, approved_at, created_at)
VALUES
  -- Critical safety terms
  ('contraindications', 'ข้อห้ามใช้', 'en', 'th', 'FDA_Thailand', 1, NOW(), NOW()),
  ('adverse reactions', 'ผลข้างเคียง', 'en', 'th', 'FDA_Thailand', 1, NOW(), NOW()),
  ('adverse events', 'เหตุการณ์ไม่พึงประสงค์', 'en', 'th', 'FDA_Thailand', 1, NOW(), NOW()),
  ('warnings', 'คำเตือน', 'en', 'th', 'FDA_Thailand', 1, NOW(), NOW()),
  ('precautions', 'ข้อควรระวัง', 'en', 'th', 'FDA_Thailand', 1, NOW(), NOW()),
  
  -- Dosage and administration
  ('dosage', 'ขนาดยา', 'en', 'th', 'FDA_Thailand', 1, NOW(), NOW()),
  ('dose', 'ขนาด', 'en', 'th', 'FDA_Thailand', 1, NOW(), NOW()),
  ('administration', 'วิธีใช้', 'en', 'th', 'FDA_Thailand', 1, NOW(), NOW()),
  ('indication', 'ข้อบ่งใช้', 'en', 'th', 'FDA_Thailand', 1, NOW(), NOW()),
  
  -- Drug interactions
  ('drug interactions', 'ปฏิกิริยาระหว่างยา', 'en', 'th', 'FDA_Thailand', 1, NOW(), NOW()),
  ('interactions', 'ปฏิกิริยา', 'en', 'th', 'FDA_Thailand', 1, NOW(), NOW()),
  
  -- Special populations
  ('pregnancy', 'การตั้งครรภ์', 'en', 'th', 'FDA_Thailand', 1, NOW(), NOW()),
  ('lactation', 'การให้นมบุตร', 'en', 'th', 'FDA_Thailand', 1, NOW(), NOW()),
  ('pediatric use', 'การใช้ในเด็ก', 'en', 'th', 'FDA_Thailand', 1, NOW(), NOW()),
  ('geriatric use', 'การใช้ในผู้สูงอายุ', 'en', 'th', 'FDA_Thailand', 1, NOW(), NOW()),
  
  -- Overdose
  ('overdose', 'ใช้ยาเกินขนาด', 'en', 'th', 'FDA_Thailand', 1, NOW(), NOW()),
  ('overdosage', 'การใช้ยาเกินขนาด', 'en', 'th', 'FDA_Thailand', 1, NOW(), NOW()),
  
  -- Pharmacology
  ('pharmacology', 'เภสัชวิทยา', 'en', 'th', 'FDA_Thailand', 1, NOW(), NOW()),
  ('pharmacokinetics', 'เภสัชจลนศาสตร์', 'en', 'th', 'FDA_Thailand', 1, NOW(), NOW()),
  ('pharmacodynamics', 'เภสัชพลศาสตร์', 'en', 'th', 'FDA_Thailand', 1, NOW(), NOW()),
  ('clinical pharmacology', 'เภสัชวิทยาทางคลินิก', 'en', 'th', 'FDA_Thailand', 1, NOW(), NOW()),
  
  -- Clinical studies
  ('clinical studies', 'การศึกษาทางคลินิก', 'en', 'th', 'FDA_Thailand', 1, NOW(), NOW()),
  ('clinical trials', 'การทดลองทางคลินิก', 'en', 'th', 'FDA_Thailand', 1, NOW(), NOW()),
  
  -- Storage and handling
  ('storage', 'การเก็บรักษา', 'en', 'th', 'FDA_Thailand', 1, NOW(), NOW()),
  ('expiration', 'วันหมดอายุ', 'en', 'th', 'FDA_Thailand', 1, NOW(), NOW()),
  ('shelf life', 'อายุการเก็บรักษา', 'en', 'th', 'FDA_Thailand', 1, NOW(), NOW()),
  
  -- Dosage forms
  ('tablet', 'เม็ด', 'en', 'th', 'FDA_Thailand', 1, NOW(), NOW()),
  ('capsule', 'แคปซูล', 'en', 'th', 'FDA_Thailand', 1, NOW(), NOW()),
  ('injection', 'ยาฉีด', 'en', 'th', 'FDA_Thailand', 1, NOW(), NOW()),
  ('solution', 'สารละลาย', 'en', 'th', 'FDA_Thailand', 1, NOW(), NOW()),
  ('suspension', 'ยาแขวนตะกอน', 'en', 'th', 'FDA_Thailand', 1, NOW(), NOW()),
  
  -- Routes of administration
  ('oral', 'รับประทาน', 'en', 'th', 'FDA_Thailand', 1, NOW(), NOW()),
  ('topical', 'ทาภายนอก', 'en', 'th', 'FDA_Thailand', 1, NOW(), NOW()),
  ('intravenous', 'ทางหลอดเลือดดำ', 'en', 'th', 'FDA_Thailand', 1, NOW(), NOW()),
  ('intramuscular', 'ทางกล้ามเนื้อ', 'en', 'th', 'FDA_Thailand', 1, NOW(), NOW()),
  ('subcutaneous', 'ใต้ผิวหนัง', 'en', 'th', 'FDA_Thailand', 1, NOW(), NOW())
ON CONFLICT (source_term, target_term, source_language, target_language) DO NOTHING;

-- Vietnamese (DAV) pharmaceutical terminology
INSERT INTO translation_memory (source_term, target_term, source_language, target_language, market_applicability, approved_by, approved_at, created_at)
VALUES
  -- Critical safety terms
  ('contraindications', 'Chống chỉ định', 'en', 'vi', 'DAV', 1, NOW(), NOW()),
  ('adverse reactions', 'Phản ứng có hại', 'en', 'vi', 'DAV', 1, NOW(), NOW()),
  ('adverse events', 'Tác dụng không mong muốn', 'en', 'vi', 'DAV', 1, NOW(), NOW()),
  ('warnings', 'Cảnh báo', 'en', 'vi', 'DAV', 1, NOW(), NOW()),
  ('precautions', 'Thận trọng', 'en', 'vi', 'DAV', 1, NOW(), NOW()),
  
  -- Dosage and administration
  ('dosage', 'Liều lượng', 'en', 'vi', 'DAV', 1, NOW(), NOW()),
  ('dose', 'Liều', 'en', 'vi', 'DAV', 1, NOW(), NOW()),
  ('administration', 'Cách dùng', 'en', 'vi', 'DAV', 1, NOW(), NOW()),
  ('indication', 'Chỉ định', 'en', 'vi', 'DAV', 1, NOW(), NOW()),
  
  -- Drug interactions
  ('drug interactions', 'Tương tác thuốc', 'en', 'vi', 'DAV', 1, NOW(), NOW()),
  ('interactions', 'Tương tác', 'en', 'vi', 'DAV', 1, NOW(), NOW()),
  
  -- Special populations
  ('pregnancy', 'Phụ nữ có thai', 'en', 'vi', 'DAV', 1, NOW(), NOW()),
  ('lactation', 'Phụ nữ cho con bú', 'en', 'vi', 'DAV', 1, NOW(), NOW()),
  ('pediatric use', 'Sử dụng ở trẻ em', 'en', 'vi', 'DAV', 1, NOW(), NOW()),
  ('geriatric use', 'Sử dụng ở người cao tuổi', 'en', 'vi', 'DAV', 1, NOW(), NOW()),
  
  -- Overdose
  ('overdose', 'Quá liều', 'en', 'vi', 'DAV', 1, NOW(), NOW()),
  ('overdosage', 'Dùng quá liều', 'en', 'vi', 'DAV', 1, NOW(), NOW()),
  
  -- Pharmacology
  ('pharmacology', 'Dược lý học', 'en', 'vi', 'DAV', 1, NOW(), NOW()),
  ('pharmacokinetics', 'Dược động học', 'en', 'vi', 'DAV', 1, NOW(), NOW()),
  ('pharmacodynamics', 'Dược lực học', 'en', 'vi', 'DAV', 1, NOW
sql
', 'en', 'vi', 'DAV', 1, NOW(), NOW()),
  ('clinical pharmacology', 'Dược lý lâm sàng', 'en', 'vi', 'DAV', 1, NOW(), NOW()),
  
  -- Clinical studies
  ('clinical studies', 'Nghiên cứu lâm sàng', 'en', 'vi', 'DAV', 1, NOW(), NOW()),
  ('clinical trials', 'Thử nghiệm lâm sàng', 'en', 'vi', 'DAV', 1, NOW(), NOW()),
  
  -- Storage and handling
  ('storage', 'Bảo quản', 'en', 'vi', 'DAV', 1, NOW(), NOW()),
  ('expiration', 'Hạn sử dụng', 'en', 'vi', 'DAV', 1, NOW(), NOW()),
  ('shelf life', 'Thời hạn sử dụng', 'en', 'vi', 'DAV', 1, NOW(), NOW()),
  
  -- Dosage forms
  ('tablet', 'Viên nén', 'en', 'vi', 'DAV', 1, NOW(), NOW()),
  ('capsule', 'Viên nang', 'en', 'vi', 'DAV', 1, NOW(), NOW()),
  ('injection', 'Tiêm', 'en', 'vi', 'DAV', 1, NOW(), NOW()),
  ('solution', 'Dung dịch', 'en', 'vi', 'DAV', 1, NOW(), NOW()),
  ('suspension', 'Hỗn dịch', 'en', 'vi', 'DAV', 1, NOW(), NOW()),
  
  -- Routes of administration
  ('oral', 'Uống', 'en', 'vi', 'DAV', 1, NOW(), NOW()),
  ('topical', 'Bôi ngoài da', 'en', 'vi', 'DAV', 1, NOW(), NOW()),
  ('intravenous', 'Tiêm tĩnh mạch', 'en', 'vi', 'DAV', 1, NOW(), NOW()),
  ('intramuscular', 'Tiêm bắp', 'en', 'vi', 'DAV', 1, NOW(), NOW()),
  ('subcutaneous', 'Tiêm dưới da', 'en', 'vi', 'DAV', 1, NOW(), NOW())
ON CONFLICT (source_term, target_term, source_language, target_language) DO NOTHING;

-- Create indexes for efficient terminology lookup
CREATE INDEX IF NOT EXISTS idx_translation_memory_thai ON translation_memory(target_language, market_applicability) WHERE target_language = 'th';
CREATE INDEX IF NOT EXISTS idx_translation_memory_vietnamese ON translation_memory(target_language, market_applicability) WHERE target_language = 'vi';
CREATE INDEX IF NOT EXISTS idx_translation_memory_source_term_thai ON translation_memory(source_term) WHERE target_language = 'th';
CREATE INDEX IF NOT EXISTS idx_translation_memory_source_term_vietnamese ON translation_memory(source_term) WHERE target_language = 'vi';