import { Module } from '@nestjs/common';
import { ElasticsearchService } from './elasticsearch.service';
import { PpeSearchService } from './ppe-search.service';
import { RegulationSearchService } from './regulation-search.service';
import { CompanySearchService } from './company-search.service';
import { SearchController } from './search.controller';

@Module({
  controllers: [SearchController],
  providers: [
    ElasticsearchService,
    PpeSearchService,
    RegulationSearchService,
    CompanySearchService,
  ],
  exports: [
    ElasticsearchService,
    PpeSearchService,
    RegulationSearchService,
    CompanySearchService,
  ],
})
export class SearchModule {}
