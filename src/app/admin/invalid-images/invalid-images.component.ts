import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { FireBaseAdminService } from 'src/app/shared/fire-base-admin.service';

@Component({
  selector: 'app-invalid-images',
  templateUrl: './invalid-images.component.html',
  styleUrls: ['./invalid-images.component.scss'],
})
export class InvalidImagesComponent implements OnInit {
  @Input() data: any[] = [];

  checkedImages: { [key: string]: boolean } = {}; // Store image checks

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

  // Function to check all images and store results
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
