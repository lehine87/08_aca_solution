import { supabase } from './supabase'

// 시간 문자열을 분으로 변환 (예: "14:30" -> 870)
export const timeToMinutes = (timeString) => {
  const [hours, minutes] = timeString.split(':').map(Number)
  return hours * 60 + minutes
}

// 분을 시간 문자열로 변환 (예: 870 -> "14:30")
export const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

// 두 시간 범위가 겹치는지 확인
export const isTimeOverlap = (start1, end1, start2, end2) => {
  const start1Min = timeToMinutes(start1)
  const end1Min = timeToMinutes(end1)
  const start2Min = timeToMinutes(start2)
  const end2Min = timeToMinutes(end2)
  
  // 겹치지 않는 경우: end1 <= start2 || end2 <= start1
  // 겹치는 경우는 이것의 반대
  return !(end1Min <= start2Min || end2Min <= start1Min)
}

// 교실 사용 충돌 검사
export const checkClassroomConflict = async (classroom, schedules, excludeClassId = null) => {
  if (!classroom || schedules.length === 0) {
    return { hasConflict: false, conflicts: [] }
  }

  try {
    // 같은 교실을 사용하는 다른 클래스들의 스케줄 조회
    let query = supabase
      .from('classes')
      .select(`
        id,
        name,
        classroom,
        class_schedules(day_of_week, start_time, end_time)
      `)
      .eq('classroom', classroom)
      .eq('status', 'active')

    // 수정하는 경우 현재 클래스 제외
    if (excludeClassId) {
      query = query.neq('id', excludeClassId)
    }

    const { data: existingClasses, error } = await query

    if (error) throw error

    const conflicts = []

    // 각 기존 클래스와 충돌 검사
    existingClasses?.forEach(existingClass => {
      existingClass.class_schedules?.forEach(existingSchedule => {
        schedules.forEach((newSchedule, index) => {
          // 같은 요일인지 확인
          if (parseInt(newSchedule.day_of_week) === existingSchedule.day_of_week) {
            // 시간 겹침 확인
            if (isTimeOverlap(
              newSchedule.start_time,
              newSchedule.end_time,
              existingSchedule.start_time,
              existingSchedule.end_time
            )) {
              conflicts.push({
                type: 'classroom',
                scheduleIndex: index,
                conflictWith: {
                  className: existingClass.name,
                  dayOfWeek: existingSchedule.day_of_week,
                  startTime: existingSchedule.start_time,
                  endTime: existingSchedule.end_time
                },
                message: `${existingClass.name} 클래스와 교실(${classroom}) 사용 시간이 겹칩니다`
              })
            }
          }
        })
      })
    })

    return {
      hasConflict: conflicts.length > 0,
      conflicts
    }

  } catch (error) {
    console.error('교실 충돌 검사 오류:', error)
    return { hasConflict: false, conflicts: [], error: error.message }
  }
}

// 강사 스케줄 충돌 검사
export const checkInstructorConflict = async (instructorId, schedules, excludeClassId = null) => {
  if (!instructorId || schedules.length === 0) {
    return { hasConflict: false, conflicts: [] }
  }

  try {
    // 같은 강사가 담당하는 다른 클래스들의 스케줄 조회
    let query = supabase
      .from('classes')
      .select(`
        id,
        name,
        main_instructor_id,
        class_schedules(day_of_week, start_time, end_time)
      `)
      .eq('main_instructor_id', instructorId)
      .eq('status', 'active')

    // 수정하는 경우 현재 클래스 제외
    if (excludeClassId) {
      query = query.neq('id', excludeClassId)
    }

    const { data: existingClasses, error } = await query

    if (error) throw error

    const conflicts = []

    // 각 기존 클래스와 충돌 검사
    existingClasses?.forEach(existingClass => {
      existingClass.class_schedules?.forEach(existingSchedule => {
        schedules.forEach((newSchedule, index) => {
          // 같은 요일인지 확인
          if (parseInt(newSchedule.day_of_week) === existingSchedule.day_of_week) {
            // 시간 겹침 확인 (강사는 10분 이동시간 고려)
            const bufferMinutes = 10
            const newStart = timeToMinutes(newSchedule.start_time)
            const newEnd = timeToMinutes(newSchedule.end_time) + bufferMinutes
            const existingStart = timeToMinutes(existingSchedule.start_time)
            const existingEnd = timeToMinutes(existingSchedule.end_time) + bufferMinutes

            if (!(newEnd <= existingStart || existingEnd <= newStart)) {
              conflicts.push({
                type: 'instructor',
                scheduleIndex: index,
                conflictWith: {
                  className: existingClass.name,
                  dayOfWeek: existingSchedule.day_of_week,
                  startTime: existingSchedule.start_time,
                  endTime: existingSchedule.end_time
                },
                message: `${existingClass.name} 클래스와 강사 스케줄이 겹칩니다 (이동시간 10분 포함)`
              })
            }
          }
        })
      })
    })

    return {
      hasConflict: conflicts.length > 0,
      conflicts
    }

  } catch (error) {
    console.error('강사 충돌 검사 오류:', error)
    return { hasConflict: false, conflicts: [], error: error.message }
  }
}

// 종합 충돌 검사
export const checkScheduleConflicts = async (classroom, instructorId, schedules, excludeClassId = null) => {
  const [classroomResult, instructorResult] = await Promise.all([
    checkClassroomConflict(classroom, schedules, excludeClassId),
    checkInstructorConflict(instructorId, schedules, excludeClassId)
  ])

  const allConflicts = [
    ...classroomResult.conflicts,
    ...instructorResult.conflicts
  ]

  return {
    hasConflict: allConflicts.length > 0,
    conflicts: allConflicts,
    classroomConflicts: classroomResult.conflicts,
    instructorConflicts: instructorResult.conflicts
  }
}

// 요일 이름 반환
export const getDayName = (dayNumber) => {
  const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
  return days[dayNumber] || `${dayNumber}요일`
}

// 시간 포맷팅
export const formatTime = (timeString) => {
  return timeString ? timeString.slice(0, 5) : ''
}

// 충돌 메시지 포맷팅
export const formatConflictMessage = (conflict) => {
  const dayName = getDayName(conflict.conflictWith.dayOfWeek)
  const timeRange = `${formatTime(conflict.conflictWith.startTime)}-${formatTime(conflict.conflictWith.endTime)}`
  
  return `${conflict.conflictWith.className} (${dayName} ${timeRange})`
}