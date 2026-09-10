/**
 * Единственное место, где фронт разговаривает с GraphQL-API.
 *
 * Запрос уходит на сборке и повторяется не чаще раза в час: страница
 * открывается мгновенно и не ложится, если бэкенд спит. Данные визитки
 * меняются реже, чем раз в час, — держать живой запрос на каждый заход
 * значило бы платить задержкой за свежесть, которая никому не нужна.
 */

const API_URL = process.env.API_URL ?? 'http://localhost:3000/graphql';

/**
 * Next держит кеш этого запроса между сборками — в том числе между деплоями
 * на Vercel. При большом окне правка данных в сиде доезжала бы до сайта не
 * сразу после редеплоя, а только по истечении срока: пять минут делают такую
 * рассинхронизацию незаметной, оставляя страницу статической.
 */
const REVALIDATE_SECONDS = 300;

const PROFILE_QUERY = `query ProfileForSite {
  profile {
    name
    description
    links { id label url }
    skills { id name category }
    experience {
      id
      company
      position
      period
      startDate
      isCurrent
      durationMonths
      achievements { id text }
    }
    projects { id name repoUrl liveUrl description }
  }
}`;

export type SkillCategory = 'FRONTEND' | 'BACKEND' | 'AI' | 'TOOLS';

export interface ProfileLink {
  id: string;
  label: string;
  url: string;
}

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
}

export interface Achievement {
  id: string;
  text: string;
}

export interface Experience {
  id: string;
  company: string;
  position: string;
  /** Готовая к показу строка периода: форматирует её бэкенд, не сайт. */
  period: string;
  /** ISO-дата начала. Нужна там, где считают год, а не показывают период. */
  startDate: string;
  isCurrent: boolean;
  durationMonths: number;
  achievements: Achievement[];
}

export interface Project {
  id: string;
  name: string;
  repoUrl: string | null;
  liveUrl: string | null;
  description: string | null;
}

export interface Profile {
  name: string;
  description: string;
  links: ProfileLink[];
  skills: Skill[];
  experience: Experience[];
  projects: Project[];
}

interface GraphQLResponse {
  data?: { profile: Profile };
  errors?: { message: string }[];
}

export async function fetchProfile(): Promise<Profile> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query: PROFILE_QUERY }),
    next: { revalidate: REVALIDATE_SECONDS },
  });

  if (!response.ok) {
    throw new Error(`GraphQL API ответил ${response.status} на ${API_URL}`);
  }

  const body = (await response.json()) as GraphQLResponse;

  // Ошибку не проглатываем: пустая страница, собранная «успешно», хуже
  // упавшей сборки — сломанный деплой тогда не отличить от рабочего.
  if (body.errors?.length) {
    throw new Error(`GraphQL вернул ошибки: ${body.errors.map((e) => e.message).join('; ')}`);
  }

  if (!body.data?.profile) {
    throw new Error('GraphQL вернул пустой профиль');
  }

  return body.data.profile;
}
