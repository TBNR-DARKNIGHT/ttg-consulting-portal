-- Topics are display text chosen by the uploader, not URL slugs.
update public.resources
set topic = case topic
  when 'dsa-pathways' then 'DSA Pathways'
  when 'dsa-branding-worksheet' then 'DSA Branding Worksheet'
  when 'interview-preparation' then 'Interview Preparation'
  when 'timelines-deadlines' then 'Timelines & Deadlines'
  when 'opportunities-directory' then 'Opportunities Directory'
  when 'test-pdf' then 'Test PDF'
  when 'test-video' then 'Test Video'
  else initcap(replace(topic, '-', ' '))
end
where topic like '%-%';
