import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL 또는 Key가 설정되지 않았습니다.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 연결 테스트 함수
export async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('Supabase 연결 오류:', error)
      return { success: false, error: error.message }
    }
    
    console.log('Supabase 연결 성공!')
    return { success: true, data }
  } catch (err) {
    console.error('연결 테스트 실패:', err)
    return { success: false, error: err.message }
  }
}