import AlloyComponents from "./AlloyComponents";

interface AlloyBuildConfig {
  orgId: string;
  edgeConfigId: string;
  includedComponents: AlloyComponents[];
  minify: boolean;
}

export default AlloyBuildConfig;
