import fs from 'fs';

let content = fs.readFileSync('src/components/SmartPlanningHub.tsx', 'utf8');

// 1. availableGrades map at line 1080
content = content.replace(
  `{availableGrades.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}`,
  `{availableGrades.map((g, idx) => (
                    <option key={\`grade-\${g}-\${idx}\`} value={g}>{g}</option>
                  ))}`
);

// 2. availableGrades map at line 1534
content = content.replace(
  `{availableGrades.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}`,
  `{availableGrades.map((g, idx) => (
                    <option key={\`grade2-\${g}-\${idx}\`} value={g}>{g}</option>
                  ))}`
);

// 3. availableSubjects map at line 1548
content = content.replace(
  `{availableSubjects.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}`,
  `{availableSubjects.map((s, idx) => (
                    <option key={\`subj-\${s}-\${idx}\`} value={s}>{s}</option>
                  ))}`
);

// 4. timetableSubjects map at line 1222
content = content.replace(
  `{timetableSubjects.map(sub => (
                      <button
                        key={sub}`,
  `{timetableSubjects.map((sub, idx) => (
                      <button
                        key={\`tt-sub-\${sub}-\${idx}\`}`
);

// 5. timetableSubjects map at line 1261
content = content.replace(
  `{timetableSubjects.map(sub => (
                  <div key={sub} className="py-4`,
  `{timetableSubjects.map((sub, idx) => (
                  <div key={\`tt-div-\${sub}-\${idx}\`} className="py-4`
);

// 6. ALL_WEEKDAYS map at line 1284
content = content.replace(
  `{ALL_WEEKDAYS.map((day) => (
                            <button
                              key={day}`,
  `{ALL_WEEKDAYS.map((day, idx) => (
                            <button
                              key={\`weekday-\${day}-\${idx}\``
);

// 7. weekForecastDays map at line 1576
content = content.replace(
  `{weekForecastDays.map((d) => (
                    <span key={d.day}`,
  `{weekForecastDays.map((d, idx) => (
                    <span key={\`forecast-day-\${d.day}-\${idx}\``
);

// 8. weekForecastDays map at line 1875
content = content.replace(
  `{weekForecastDays.map((d, idx) => (
                    <option key={d.day} value={idx}>`,
  `{weekForecastDays.map((d, i) => (
                    <option key={\`lesson-day-\${d.day}-\${i}\`} value={i}>`
);

fs.writeFileSync('src/components/SmartPlanningHub.tsx', content);
console.log('Fixed keys in SmartPlanningHub.tsx successfully!');
