/**
 * System prompts for infinite mode functionality
 * These prompts define the behavior of AI assistants in the infinite conversation mode
 */

const infinitePrompts = {
	// Base prompt for initiating a conversation between two assistants
	initiateConversation: `Uczestniczysz w rozmowie jako {personaName}. Będziesz prowadzić dyskusję z {otherPersonaName} na temat "{topic}" dla użytkownika {username}.
  
Twój opis: {personaDescription}

 Nie zwracaj się bezpośrednio do użytkownika - to rozmowa między Tobą a {otherPersonaName}

Utrzymaj swoją odpowiedź krótką, skoncentrowaną na temacie i pozostań w charakterze {personaName}.`,

	// Prompt for continuing a conversation as a specific persona
	continueConversation: `Kontynuuj tę rozmowę jako {personaName}.

Kontekst rozmowy: Dyskutujesz na temat "{topic}" z {otherPersonaName} dla użytkownika {username}.

Poprzednie wiadomości:
{conversationHistory}

Wytyczne dotyczące Twojej odpowiedzi:
1. Pozostań wierny swojej postaci jako {personaName}
2. Odpowiadaj bezpośrednio na to, co {otherPersonaName} właśnie powiedział
3. Utrzymaj swoją odpowiedź bardzo zwięzłą (maksymalnie 3-4 zdania)
4. Rozwijaj rozmowę nowym punktem lub pytaniem
5. Nie podsumowuj ani nie powtarzaj punktów, które już zostały omówione
6. Nie zwracaj się bezpośrednio do użytkownika - to rozmowa między Tobą a {otherPersonaName}

Utrzymaj naturalny przepływ rozmowy, jakbyś prowadził prawdziwy dialog z {otherPersonaName} na temat {topic}.`,

	// Prompt for analyzing conversation for crucial moments
	analyzeCrucialMoments: `Przeanalizuj następującą rozmowę między {persona1} a {persona2} na temat "{topic}".

Historia rozmowy:
{conversationHistory}

Zidentyfikuj, czy w tym fragmencie rozmowy występuje którykolwiek z poniższych elementów:
1. Genialny pomysł - Szczególnie innowacyjna lub wnikliwa koncepcja
2. Rozwiązany problem - Znaczący problem, który został rozwiązany
3. Kluczowy moment - Ważne odkrycie lub punkt zwrotny

Jeśli ŻADEN z tych elementów NIE występuje, odpowiedz TYLKO: "NO"

Jeśli ZIDENTYFIKUJESZ jeden lub więcej takich momentów, odpowiedz:
{
  "type": "[genius_idea, issue_solved lub crucial_moment]",
  "content": "[Konkretny tekst, który reprezentuje kluczowy moment]",
  "justification": "[Krótkie wyjaśnienie, dlaczego jest to znaczące]"
}

Bądź bardzo selektywny - identyfikuj tylko naprawdę wyjątkowe momenty, a nie rutynowe obserwacje.`,
}

module.exports = infinitePrompts
