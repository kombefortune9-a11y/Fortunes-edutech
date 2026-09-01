import { SYLLABI } from './src/data/syllabi';

const formData = {
  grade: "Grade 2",
  subject: "English",
  term: "Term 1"
};

const getEnglishTopics = () => {
    const g = formData.grade.toLowerCase();
    const isEng = formData.subject.toLowerCase().includes('english');
    
    let data = null;
    if (g.includes('grade 1') && !g.includes('grade 10') && !g.includes('grade 11') && !g.includes('grade 12')) data = SYLLABI['Grade 1 (CBC)'];
    else if (g.includes('grade 2')) data = SYLLABI['Grade 2 (CBC)'];

    if (!data || !isEng) return { oral: [], literacy: [], isEnglish: false };

    const selectedTermNum = formData.term ? formData.term.toString().replace(/[^0-9]/g, "") : "";

    const filterTopicsByTerm = (topicsList: any[]) => {
      if (!Array.isArray(topicsList)) return [];
      if (!selectedTermNum) return topicsList;
      return topicsList.filter(t => {
        if (!t.term) return true;
        const tNum = t.term.toString().replace(/[^0-9]/g, "");
        return tNum === selectedTermNum;
      });
    };

    return {
      oral: filterTopicsByTerm(data['Oral English'] || []),
      literacy: filterTopicsByTerm(data['literacy in English'] || []),
      isEnglish: true
    };
  };

console.log(getEnglishTopics().oral.length);
