-- 기존에 teamMemberLevel 등으로 잘못 저장된 슈퍼팬 데이터가 있으면 1회 실행하세요.
-- client_id는 본인 클라이언트 ID로 바꿔서 실행하면 됩니다.
update overlay_client_states
set state = jsonb_set(state, '{superFans}', '{}'::jsonb),
    updated_at = now()
where client_id = 'az_luly';
