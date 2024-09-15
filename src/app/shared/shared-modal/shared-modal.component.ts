import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-shared-modal',
  templateUrl: './shared-modal.component.html',
  styleUrls: ['./shared-modal.component.scss'],
})
export class SharedModalComponent implements OnInit {
  @Input() deleteSvg = false;
  @Input() warningSvg = false;
  @Input() data: any[] = [];
  @Input() message: string = '';

  filteredData: any[] = [];
  currentPage = 1; // Current page of pagination
  itemsPerPage = 5; // Number of items per page
  searchTerm: string = ''; // Holds the search input

  constructor(public activeModal: NgbActiveModal) {}

  ngOnInit(): void {
    if (this.data.length > 0) this.filteredData = this.data;
  }
  confirm() {
    this.activeModal.close(true);
  }

  getIndex(index: number): number {
    return (this.currentPage - 1) * this.itemsPerPage + index + 1;
  }

  search() {
    if (this.searchTerm) {
      // Perform search on the original dataArray to always start with the full dataset
      this.filteredData = this.data.filter(
        (item: any) =>
          (item.Name &&
            item.Name.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
          (item.NationalId && item.NationalId.includes(this.searchTerm))
      );
    } else {
      // If search term is empty, reset to show all data with Image property
      this.filteredData = this.data;
    }
    this.currentPage = 1; // Reset to the first page after search
  }

  openImage(item: any) {
    window.open(item.Image, '_blank');
  }
}
