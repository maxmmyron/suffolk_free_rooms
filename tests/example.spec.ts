import { test, expect } from '@playwright/test';

test('Find Courses', async ({ page }) => {
  await page.goto('https://www.suffolk.edu/coursesearch/courses');

  // first pass
  let res = await fetch("https://www.suffolk.edu/coursesearch/api/SearchCourses", {
    "credentials": "include",
    "headers": {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.5",
        "Content-Type": "application/json",
        "Sec-GPC": "1",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "Pragma": "no-cache",
        "Cache-Control": "no-cache"
    },
    "referrer": "https://www.suffolk.edu/coursesearch/courses",
    "body": "{\"AcademicLevel\":[\"Undergraduate\"],\"Subject\":[],\"AcademicPeriod\":[\"Fall 2024\"],\"Campus\":[],\"DeliveryMode\":[\"In-Person\",\"Hybrid\"],\"CourseStatus\":[],\"SectionCapacity\":[],\"MeetingDay\":[],\"MeetingTime\":[],\"Page\":1,\"PageSize\":500}",
    "method": "POST",
    "mode": "cors"
  });

  let courseTitles: Array<string> = [];

  let data = await res.json();

  courseTitles = data.Courses.map((course:any) => course.SectionTitle);

  const total = data.Total;
  const pages = Math.ceil(total / 500);

  for (let i = 2; i <= pages; i++) {
    let res = await fetch("https://www.suffolk.edu/coursesearch/api/SearchCourses", {
      "credentials": "include",
      "headers": {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
          "Accept": "*/*",
          "Accept-Language": "en-US,en;q=0.5",
          "Content-Type": "application/json",
          "Sec-GPC": "1",
          "Sec-Fetch-Dest": "empty",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Site": "same-origin",
          "Pragma": "no-cache",
          "Cache-Control": "no-cache"
      },
      "referrer": "https://www.suffolk.edu/coursesearch/courses",
      "body": "{\"AcademicLevel\":[\"Undergraduate\"],\"Subject\":[],\"AcademicPeriod\":[\"Fall 2024\"],\"Campus\":[],\"DeliveryMode\":[\"In-Person\",\"Hybrid\"],\"CourseStatus\":[],\"SectionCapacity\":[],\"MeetingDay\":[],\"MeetingTime\":[],\"Page\":"+i+",\"PageSize\":500}",
      "method": "POST",
      "mode": "cors"
    });

    let data = await res.json();

    courseTitles = courseTitles.concat(data.Courses.map((course:any) => course.SectionTitle));
  }

  console.log(`Total courses: ${total} (${courseTitles.length})`);
  console.log(courseTitles);
});

test("Find Sections", async ({ page }) => {
  await page.goto('https://prodss.suffolk.edu/Student/Courses/Search');

  const token = await page.$eval('input[name="__RequestVerificationToken"]', (el) => el.getAttribute('value'));

  if (!token) {
    throw new Error("Token not found");
  }

  /**
   * TypeError: fetch failed
   * cause: Error: unable to verify the first certificate
   * at TLSWrap.ssl.onhandshakedone -> code: 'UNABLE_TO_VERIFY_LEAF_SIGNATURE'
   */

  try {
    let res = await fetch("https://prodss.suffolk.edu/Student/Courses/SectionsAsync", {
      "headers": {
        "__isguestuser": "true",
        "__requestverificationtoken": token,
        "content-type": "application/json, charset=UTF-8",
        "x-requested-with": "XMLHttpRequest"
      },
      "referrer": "https://prodss.suffolk.edu/Student/Courses/Search",
      "referrerPolicy": "strict-origin-when-cross-origin",
      "body": "{\"courseId\":\"7245\",\"sectionIds\":[\"160962\"]}",
      "method": "POST",
      "mode": "cors",
    });

    console.log(res);

    let data = await res.json();

    console.log("Sections fetched!");
    console.log(data);
  } catch (e) {
    console.log("Erroring attempting to fetch sections");
    console.error(e);
  }
});
