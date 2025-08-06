# 📋 출결 관리 시스템 설치 가이드

## 🎯 완성된 기능들

✅ **메인 출결 관리 페이지** (`/attendance`)
- 날짜별 수업 조회
- 클래스별 학생 현황 미리보기
- 출결 체크 페이지로 바로 이동

✅ **클래스별 출결 체크 페이지** (`/attendance/class/[id]`)
- 실시간 출결 상태 변경 (출석/결석/지각/조퇴)
- 자동 체크인/체크아웃 시간 기록
- 학생별 메모 기능
- 일괄 출석 처리 기능
- 출결 현황 실시간 통계

✅ **출결 통계 대시보드** (`/attendance/stats`)
- 전체 출결 현황 요약
- 오늘/주간 출석 트렌드
- 클래스별 출석률 순위
- 출석률 낮은 학생 관리 대상
- 다양한 필터링 옵션

## 🗄️ 필수 데이터베이스 테이블

출결 시스템 사용을 위해 Supabase SQL Editor에서 다음 테이블을 생성해야 합니다:

### 1. attendance 테이블 생성

```sql
-- 출결 기록 테이블
CREATE TABLE attendance (
  id BIGSERIAL PRIMARY KEY,
  class_id BIGINT REFERENCES classes(id) ON DELETE CASCADE,
  student_id BIGINT REFERENCES students(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL, -- 'present', 'absent', 'late', 'early_leave'
  check_in_time TIME,
  check_out_time TIME,
  memo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 같은 학생의 같은 클래스 같은 날은 중복 불가
  UNIQUE(class_id, student_id, attendance_date)
);

-- 인덱스 생성 (성능 향상을 위해)
CREATE INDEX idx_attendance_date ON attendance(attendance_date);
CREATE INDEX idx_attendance_class_date ON attendance(class_id, attendance_date);
CREATE INDEX idx_attendance_student_date ON attendance(student_id, attendance_date);
```

### 2. 기존 테이블들 확인

출결 시스템은 다음 테이블들이 필요합니다 (클래스 관리에서 이미 생성됨):

```sql
-- 이미 생성되어 있어야 할 테이블들
- students (학생 정보)
- classes (클래스 정보)
- instructors (강사 정보) 
- class_schedules (클래스 스케줄)
- class_students (클래스-학생 관계)
```

## 📊 테스트용 샘플 데이터

테스트를 위해 샘플 출결 데이터를 삽입하세요:

```sql
-- 샘플 출결 데이터 (최근 7일)
INSERT INTO attendance (class_id, student_id, attendance_date, status, check_in_time, memo) VALUES
-- 어제 (class_id와 student_id는 실제 데이터에 맞게 조정)
(1, 1, CURRENT_DATE - INTERVAL '1 day', 'present', '14:00', ''),
(1, 2, CURRENT_DATE - INTERVAL '1 day', 'late', '14:15', '교통 지연'),
(1, 3, CURRENT_DATE - INTERVAL '1 day', 'absent', NULL, '몸살'),

-- 오늘
(1, 1, CURRENT_DATE, 'present', '13:55', ''),
(1, 2, CURRENT_DATE, 'present', '14:00', ''),
-- student_id 3은 아직 출결 체크 안함

-- 2일 전
(1, 1, CURRENT_DATE - INTERVAL '2 days', 'present', '14:00', ''),
(1, 2, CURRENT_DATE - INTERVAL '2 days', 'early_leave', '14:00', '병원 진료'),
(1, 3, CURRENT_DATE - INTERVAL '2 days', 'present', '14:05', '');
```

## 🚀 사용 방법

### 1. 일일 출결 체크
1. `/attendance` 페이지에서 날짜 선택
2. 해당 날짜의 수업 목록 확인
3. 각 클래스의 "📋 출결 체크" 버튼 클릭
4. 학생별로 출석 상태 선택 (✅출석, ❌결석, ⏰지각, 🏃조퇴)
5. 필요시 메모 입력
6. "💾 출결 저장" 버튼으로 저장

### 2. 출결 통계 확인
1. `/attendance/stats` 페이지 접속
2. 기간 선택 (최근 7일/30일)
3. 전체 현황, 클래스별, 학생별 통계 확인
4. 출석률 낮은 학생 관리 대상 확인

### 3. 빠른 액션들
- **전체 출석 처리**: 모든 학생을 한번에 출석으로 체크
- **날짜 변경**: 다른 날의 출결 기록도 쉽게 관리
- **실시간 통계**: 출결 상태 변경시 즉시 통계 업데이트

## 🎯 주요 특징

### 📋 출결 체크 페이지
- ✅ **직관적인 버튼식 인터페이스** - 아이콘으로 한눈에 상태 파악
- 🕒 **자동 시간 기록** - 출석/지각시 체크인 시간, 조퇴시 체크아웃 시간 자동 기록
- 📝 **메모 기능** - 각 학생별 특이사항 기록 가능
- 📊 **실시간 통계** - 상단에 출석/결석/지각/조퇴 실시간 카운트
- 🎯 **일괄 처리** - 전체 출석 처리 버튼으로 효율성 향상

### 📊 통계 대시보드  
- 📈 **다양한 시각화** - 차트와 그래프로 한눈에 파악
- 🎯 **관리 대상 식별** - 출석률 낮은 학생 자동 식별
- 📅 **기간별 분석** - 주간/월간 트렌드 분석
- 🏆 **클래스별 순위** - 출석률 기준 클래스 성과 비교

### 🔄 연동 기능
- **클래스 관리와 연동** - 각 클래스 카드에서 바로 출결 체크 가능
- **학생 관리와 연동** - 학생 정보와 출결 이력 연결
- **메인 대시보드 연동** - 오늘의 할 일에 출결 체크 항목 포함

## ⚠️ 주의사항

1. **attendance 테이블을 먼저 생성**하세요
2. **클래스에 학생이 등록**되어 있어야 출결 체크 가능
3. **클래스 스케줄이 설정**되어 있어야 해당 요일에 수업 표시
4. 출결 **중복 방지 제약조건**으로 같은 날 같은 클래스 중복 기록 불가

## 🎉 완성!

출결 관리 시스템이 완전히 구현되었습니다! 

**다음 단계 추천:**
- 강사 관리 시스템 구현
- 수강료 관리 시스템 구현  
- 성적 관리 시스템 구현
- 학부모 알림 시스템 구현