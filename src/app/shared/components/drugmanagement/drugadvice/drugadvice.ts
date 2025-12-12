import { Component, OnInit } from '@angular/core';

interface DrugAdvice {
  id: number;
  advice: string;
  status: string;
}

@Component({
  selector: 'app-drug-advice',
  standalone: false,
  templateUrl: 'drugadvice.html',
  styleUrls: ['./drugadvice.css']
})
export class DrugAdviceComponent implements OnInit {
  advices: DrugAdvice[] = [
    { id: 1, advice: 'मंदिर जाएं और भगवान श्रीराम जी के चरणों में दो सफेद फूल अर्पित करें। यह उपाय कभी भी किया जा सकता है, बस उस दिन पौर्णिमस न हों। फूल चढ़ाते समय मन में प्रार्थना करें —', status: 'Active' },
    { id: 2, advice: 'Check blood sugar levels regularly if you are diabetic while on this medication.', status: 'Active' },
    { id: 3, advice: 'Do not share this medication with others, even if they have the same symptoms.', status: 'Active' },
    { id: 4, advice: 'Report any signs of allergic reaction, such as rash or swelling, immediately.', status: 'Active' },
    { id: 5, advice: 'This drug may interact with grapefruit or grapefruit juice.', status: 'Active' },
    { id: 6, advice: 'Avoid taking antacids or dairy products within 2 hours of this medication.', status: 'Active' },
    { id: 7, advice: 'Inform your doctor of any other medications or supplements you are taking.', status: 'Active' },
    { id: 8, advice: 'This medication may cause dizziness; avoid driving or operating machinery.', status: 'Active' },
    { id: 9, advice: 'Shake the bottle well before each use if it is a suspension.', status: 'Active' }
  ];

  showModal = false;
  isEditMode = false;
  formData: DrugAdvice = { id: 0, advice: '', status: 'Active' };
  entriesPerPage = 20;
  searchTerm = '';

  get filteredAdvices(): DrugAdvice[] {
    return this.advices.filter(advice =>
      advice.advice.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  ngOnInit(): void {
    // Initialize component
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.formData = { id: 0, advice: '', status: 'Active' };
    this.showModal = true;
  }

  openEditModal(id: number): void {
    const advice = this.advices.find(a => a.id === id);
    if (advice) {
      this.isEditMode = true;
      this.formData = { ...advice };
      this.showModal = true;
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.formData = { id: 0, advice: '', status: 'Active' };
    this.isEditMode = false;
  }

  saveAdvice(): void {
    if (this.formData.advice.trim()) {
      if (this.isEditMode) {
        // Update existing advice
        const index = this.advices.findIndex(a => a.id === this.formData.id);
        if (index !== -1) {
          this.advices[index] = { ...this.formData };
        }
      } else {
        // Create new advice
        const newAdvice: DrugAdvice = {
          id: Math.max(...this.advices.map(a => a.id), 0) + 1,
          advice: this.formData.advice,
          status: this.formData.status
        };
        this.advices.push(newAdvice);
      }
      this.closeModal();
    }
  }

  deleteAdvice(id: number): void {
    if (confirm('Are you sure you want to delete this advice?')) {
      this.advices = this.advices.filter(a => a.id !== id);
    }
  }
}