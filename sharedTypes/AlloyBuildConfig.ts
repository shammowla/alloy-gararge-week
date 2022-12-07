import AlloyComponents from "./AlloyComponents";

interface AlloyBuildConfig {
  orgId: string;
  edgeConfigId: string;
  includedComponents: AlloyComponents[];
}

export default AlloyBuildConfig;
